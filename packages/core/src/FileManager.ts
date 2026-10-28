import { readFile } from 'node:fs/promises'
import { inParallel, isPathInside, matchesStored, toError } from '@internals/utils'
import { ast, extractStringsFromNodes, type CodeNode, type FileNode } from '@kubb/ast'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { OutputManifest } from './outputManifest.ts'
import type { Hookable } from './Hookable.ts'
import type { Config, KubbFileProcessingUpdate, KubbHooks } from './types.ts'

/** Files kept in flight at once, writing the output and reading it back for the manifest. */
export const FILE_CONCURRENCY = 50

type ParseOptions = {
  parsers?: Map<FileNode['extname'], Parser>
}

type WriteOptions = ParseOptions & {
  storage: Storage
  signal?: AbortSignal
  /**
   * Consulted before each write so a file the output passes already normalized is recognized as
   * unchanged. Omitted when no formatter, linter, or `postGenerate` step is configured.
   */
  manifest?: OutputManifest
  /**
   * Directory the storage emptied right before this write. Files under it cannot exist yet, so they
   * are written without reading the previous value back.
   */
  cleaned?: string
  /**
   * Receives `kubb:files:processing:start`, `:update` (in input order, as files finish) and `:end` for the write. `config` fills the update rows.
   */
  hooks?: Hookable<KubbHooks>
  config?: Config
}

function joinSources(file: FileNode): string {
  return file.sources
    .map((source) => extractStringsFromNodes(source.nodes as Array<CodeNode>))
    .filter(Boolean)
    .join('\n\n')
}

/** Runs a parser call and turns a crash into a `KUBB_PARSER_FAILED` diagnostic that names the parser. */
function runParser(parser: Parser, print: () => string): string {
  try {
    return print()
  } catch (error) {
    throw new Diagnostics.Error(Diagnostics.fromExtension(error, { kind: 'parser', extension: parser }))
  }
}

/**
 * Reads a `copy` file and prints it through the parser's `copy` hook, or verbatim with `banner`/`footer` when there is none.
 */
async function parseCopy(file: FileNode, parser: Parser | undefined): Promise<string> {
  const content = await readFile(file.copy as string, 'utf8').catch((err) => {
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginFailed,
      severity: 'error',
      message: `Could not copy file into output: ${file.copy}`,
      help: 'Check that the file a plugin copies into the output exists and is readable.',
      cause: toError(err),
    })
  })

  if (parser?.copy) {
    return runParser(parser, () => parser.parse(ast.factory.createFile(parser.copy!(file, content))))
  }

  return [file.banner, content, file.footer]
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => segment.trimEnd())
    .join('\n')
}

function mergeFile<TMeta extends object = object>(a: FileNode<TMeta>, b: FileNode<TMeta>): FileNode<TMeta> {
  return {
    ...a,
    // Incoming file (b) takes precedence for banner/footer so a barrel file (whose
    // banner/footer the barrel plugin resolves last) wins over a plugin-generated
    // file at the same path.
    banner: b.banner,
    footer: b.footer,
    // A verbatim-copy file cannot be merged with rendered content; the incoming `copy` wins.
    copy: b.copy ?? a.copy,
    sources: [...a.sources, ...b.sources],
    imports: [...a.imports, ...b.imports],
    exports: [...a.exports, ...b.exports],
  }
}

function isIndexPath(path: string): boolean {
  return path.endsWith('/index.ts') || path === 'index.ts'
}

// Sort order: shortest path first. Within a length bucket, index.ts barrels last.
function compareFiles(a: FileNode, b: FileNode): number {
  return a.path.length - b.path.length || Number(isIndexPath(a.path)) - Number(isIndexPath(b.path))
}

/**
 * Writes `source` to `file.path` unless the storage already holds it, either verbatim or, per the
 * manifest, as what the output passes make of it. Checking here rather than in a driver gives a
 * storage writing to S3 or a database the same guarantee `fsStorage` has. `false` when skipped.
 */
async function writeChanged({
  storage,
  manifest,
  file,
  source,
  signal,
  cleaned,
}: Pick<WriteOptions, 'storage' | 'manifest' | 'signal' | 'cleaned'> & { file: FileNode; source: string }): Promise<boolean> {
  signal?.throwIfAborted()
  const stored = cleaned && isPathInside(file.path, cleaned) ? null : await storage.readItem(file.path)
  if (stored !== null && (matchesStored({ stored, source }) || manifest?.isUpToDate({ key: file.path, source, disk: stored }))) return false
  signal?.throwIfAborted()
  await storage.writeItem(file.path, source, { stored })
  // Only a file that was written can have been changed by the output passes.
  manifest?.track({ key: file.path, source })
  return true
}

/** Reports finished files in input order: each finished file flushes the run of finished files ahead of it as one update. */
function createProgress(files: Array<FileNode>, config: Config, hooks: Hookable<KubbHooks>): (index: number) => Promise<void> {
  const finished: Array<boolean> = []
  let flushed = 0
  return async (index) => {
    finished[index] = true
    // Rows leave `source` out: buffering it would hold every generated file in memory.
    const updates: Array<KubbFileProcessingUpdate> = []
    while (finished[flushed]) {
      flushed++
      updates.push({ file: files[flushed - 1]!, processed: flushed, total: files.length, percentage: (flushed / files.length) * 100, config })
    }
    if (updates.length) await hooks.callHook('kubb:files:processing:update', { files: updates })
  }
}

/** Links each source without a pointer to the node its file was generated from. */
function withPointer(files: ReadonlyArray<FileNode>, pointer: string | undefined): ReadonlyArray<FileNode> {
  if (!pointer) return files
  return files.map((file) => ({ ...file, sources: file.sources.map((source) => (source.pointer ? source : { ...source, pointer })) }))
}

/**
 * In-memory file store for generated files, and the writer that turns them into source
 * strings on `storage`. Files sharing a `path` are merged (sources/imports/exports
 * concatenated). The `files` getter is sorted by path length (barrel `index.ts` last
 * within a bucket).
 *
 * @example
 * ```ts
 * const manager = new FileManager()
 * manager.upsert(myFile)
 * manager.files // sorted view
 * await manager.write(manager.files, { storage: fsStorage() })
 * ```
 */
export class FileManager {
  readonly #cache = new Map<string, FileNode>()
  // Paths whose cached entry is a raw merge that `createFile` has not normalized yet. Generator
  // results land here so a plugin writing every schema into one file (`output.mode: 'file'`)
  // normalizes that file once, not once per schema over everything merged so far.
  readonly #pending = new Set<string>()
  // Cached sorted view, rebuilt lazily on the next `files` read. Nulled (not mutated) on every
  // write so callers holding a prior reference keep their snapshot, `dispose()` included.
  #sorted: Array<FileNode> | null = null
  // Files `#defer` built with `mergeFile`, which only `#cache` references, so they are safe to extend.
  readonly #merges = new WeakSet<FileNode>()

  add(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, false)
  }

  upsert(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, true)
  }

  /** Stores a generator result: a file array is upserted as is, an element renders through `renderer` first, falsy is a no-op. */
  async dispatch<TElement = unknown>({
    result,
    renderer,
    pointer,
  }: {
    result: TElement | Array<FileNode> | undefined | null
    renderer?: RendererFactory<TElement> | null
    /**
     * Pointer of the node the result was generated from, set on each source that carries none.
     */
    pointer?: string
  }): Promise<void> {
    if (!result) return

    if (Array.isArray(result)) {
      this.#defer(withPointer(result as Array<FileNode>, pointer))
      return
    }

    if (!renderer) return

    using instance = renderer()
    await instance.render(result)

    this.#defer(withPointer(instance.files, pointer))
  }

  /** Upserts without normalizing: the raw merge waits in `#pending` until the file is read. */
  #defer(files: ReadonlyArray<FileNode>): void {
    for (const file of files) {
      this.#pending.add(file.path)
      const existing = this.#cache.get(file.path)
      if (!existing) {
        this.#cache.set(file.path, file)
        continue
      }
      if (!this.#merges.has(existing)) {
        const merged = mergeFile(existing, file)
        this.#merges.add(merged)
        this.#cache.set(file.path, merged)
        continue
      }
      existing.banner = file.banner
      existing.footer = file.footer
      existing.copy = file.copy ?? existing.copy
      existing.sources.push(...file.sources)
      existing.imports.push(...file.imports)
      existing.exports.push(...file.exports)
    }
    if (files.length > 0) this.#sorted = null
  }

  /** Normalizes the pending raw merges, so every entry in `#cache` is a `createFile` result. */
  #flush(): void {
    for (const path of this.#pending) {
      this.#cache.set(path, ast.factory.createFile(this.#cache.get(path)!))
    }
    this.#pending.clear()
  }

  #store(files: ReadonlyArray<FileNode>, mergeExisting: boolean): Array<FileNode> {
    this.#flush()
    // Same-path files in one batch always merge; an existing file only on upsert.
    const batch = new Set<string>()
    const resolved = files.map((file) => {
      const existing = this.#cache.get(file.path)
      const merged = ast.factory.createFile(existing && (mergeExisting || batch.has(file.path)) ? mergeFile(existing, file) : file)
      this.#cache.set(merged.path, merged)
      batch.add(merged.path)
      return merged
    })
    if (resolved.length > 0) this.#sorted = null
    return resolved
  }

  /**
   * Removes the files at `paths`, so they are neither listed nor written.
   */
  delete(...paths: Array<string>): void {
    for (const path of paths) {
      this.#cache.delete(path)
      this.#pending.delete(path)
    }
    if (paths.length > 0) this.#sorted = null
  }

  /**
   * Releases all stored files. Called by the core after `kubb:build:end`.
   */
  dispose(): void {
    this.#cache.clear()
    this.#pending.clear()
    this.#sorted = null
  }

  /**
   * All stored files in the order they were first added, so a worker thread hands its output to
   * the main thread in the order one unbroken walk would have added it.
   */
  get unsorted(): Array<FileNode> {
    this.#flush()
    return [...this.#cache.values()]
  }

  /**
   * All stored files in stable sort order (shortest path first, barrel files
   * last within a length bucket). Returns a cached view, do not mutate.
   */
  get files(): Array<FileNode> {
    this.#flush()
    return (this.#sorted ??= [...this.#cache.values()].sort(compareFiles))
  }

  /**
   * Converts a file's AST sources (or its `copy` source) into the final on-disk string.
   */
  async parse(file: FileNode, { parsers }: ParseOptions = {}): Promise<string> {
    const parser = parsers?.get(file.extname)

    if (file.copy) {
      return parseCopy(file, parser)
    }

    if (!parser) {
      return joinSources(file)
    }

    return runParser(parser, () => parser.parse(file))
  }

  /**
   * Parses and writes every file through a bounded pool of workers. A small spec runs all its files
   * at once; a spec with thousands of files keeps at most {@link FILE_CONCURRENCY} parsed sources in
   * memory rather than holding every source, while still overlapping each file's write with the
   * next file's parse. Files finish in whatever order they parse, so each finished file flushes the
   * run of finished files ahead of it as one `kubb:files:processing:update`, keeping rows in input order.
   *
   * A file the storage already holds is skipped, so a rebuild that generates identical output
   * writes nothing and leaves every mtime where it was. `kubb:files:processing:end` lists the
   * skipped paths as `unchanged`.
   */
  async write(files: Array<FileNode>, { storage, parsers, manifest, signal, hooks, config, cleaned }: WriteOptions): Promise<void> {
    if (files.length === 0) return

    await hooks?.callHook('kubb:files:processing:start', { files })
    const unchanged: Array<string> = []
    const progress = hooks && config ? createProgress(files, config, hooks) : undefined

    await inParallel({
      items: files,
      limit: FILE_CONCURRENCY,
      run: async (file, index) => {
        signal?.throwIfAborted()
        const source = await this.parse(file, { parsers })
        if (source && !(await writeChanged({ storage, manifest, file, source, signal, cleaned }))) unchanged.push(file.path)
        await progress?.(index)
      },
    })

    await hooks?.callHook('kubb:files:processing:end', { files, unchanged })
  }
}
