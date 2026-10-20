import { readFile } from 'node:fs/promises'
import { inParallel, matchesStored, toError } from '@internals/utils'
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
  let content: string
  try {
    content = await readFile(file.copy as string, 'utf8')
  } catch (err) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginFailed,
      severity: 'error',
      message: `Could not copy file into output: ${file.copy}`,
      help: 'Check that the file a plugin copies into the output exists and is readable.',
      cause: toError(err),
    })
  }

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
    sources: a.sources.length ? (b.sources.length ? [...a.sources, ...b.sources] : a.sources) : b.sources,
    imports: a.imports.length ? (b.imports.length ? [...a.imports, ...b.imports] : a.imports) : b.imports,
    exports: a.exports.length ? (b.exports.length ? [...a.exports, ...b.exports] : a.exports) : b.exports,
  }
}

function isIndexPath(path: string): boolean {
  return path.endsWith('/index.ts') || path === 'index.ts'
}

// Sort order: shortest path first. Within a length bucket, index.ts barrels last.
function compareFiles(a: FileNode, b: FileNode): number {
  return a.path.length - b.path.length || Number(isIndexPath(a.path)) - Number(isIndexPath(b.path))
}

// A file is unchanged either because the storage already holds this content, or because the
// manifest knows the output passes turn this exact source into what the storage holds.
function isUnchanged({ stored, source, key, manifest }: { stored: string | null; source: string; key: string; manifest?: OutputManifest }): boolean {
  if (stored === null) return false
  if (matchesStored({ stored, source })) return true

  return manifest?.isUpToDate({ key, source, disk: stored }) ?? false
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
  // Cached sorted view, rebuilt lazily on the next `files` read. Nulled (not mutated) on every
  // write so callers holding a prior reference keep their snapshot, `dispose()` included.
  #sorted: Array<FileNode> | null = null

  add(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, false)
  }

  upsert(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, true)
  }

  /** Stores a generator result: a file array is upserted as is, an element renders through `renderer` first, falsy is a no-op. Returns the paths it stored, including files merged into an existing path. */
  async dispatch<TElement = unknown>({
    result,
    renderer,
  }: {
    result: TElement | Array<FileNode> | undefined | null
    renderer?: RendererFactory<TElement> | null
  }): Promise<Array<string>> {
    if (!result) return []

    if (Array.isArray(result)) {
      return this.upsert(...(result as Array<FileNode>)).map((file) => file.path)
    }

    if (!renderer) return []

    using instance = renderer()
    await instance.render(result)

    return this.upsert(...instance.files).map((file) => file.path)
  }

  #store(files: ReadonlyArray<FileNode>, mergeExisting: boolean): Array<FileNode> {
    const batch = files.length > 1 ? this.#dedupe(files) : files
    const resolved: Array<FileNode> = []

    for (const file of batch) {
      const existing = this.#cache.get(file.path)
      const merged = existing && mergeExisting ? ast.factory.createFile(mergeFile(existing, file)) : ast.factory.createFile(file)
      this.#cache.set(merged.path, merged)
      resolved.push(merged)
    }

    if (resolved.length > 0) this.#sorted = null
    return resolved
  }

  // Merges same-path entries within a multi-file batch so the cache update loop stays uniform.
  #dedupe(files: ReadonlyArray<FileNode>): Array<FileNode> {
    const seen = new Map<string, FileNode>()
    for (const file of files) {
      const prev = seen.get(file.path)
      seen.set(file.path, prev ? mergeFile(prev, file) : file)
    }
    return [...seen.values()]
  }

  /**
   * Releases all stored files. Called by the core after `kubb:build:end`.
   */
  dispose(): void {
    this.#cache.clear()
    this.#sorted = null
  }

  /**
   * All stored files in stable sort order (shortest path first, barrel files
   * last within a length bucket). Returns a cached view, do not mutate.
   */
  get files(): Array<FileNode> {
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
  async write(files: Array<FileNode>, { storage, parsers, manifest, signal, hooks, config }: WriteOptions): Promise<void> {
    if (files.length === 0) return

    await hooks?.callHook('kubb:files:processing:start', { files })

    const total = files.length
    const finished: Array<boolean> = []
    const unchanged: Array<string> = []
    let flushed = 0

    await inParallel({
      items: files,
      limit: FILE_CONCURRENCY,
      run: async (file, index) => {
        const written = await this.#writeFile(file, { storage, parsers, manifest, signal })
        if (written === false) unchanged.push(file.path)
        if (!config) return

        finished[index] = true
        // Rows leave `source` out: buffering it would hold every generated file in memory.
        const updates: Array<KubbFileProcessingUpdate> = []
        while (finished[flushed]) {
          flushed++
          updates.push({ file: files[flushed - 1]!, processed: flushed, total, percentage: (flushed / total) * 100, config })
        }
        if (updates.length) await hooks?.callHook('kubb:files:processing:update', { files: updates })
      },
    })

    await hooks?.callHook('kubb:files:processing:end', { files, unchanged })
  }

  /** Writes one file. Resolves `false` when the storage already holds it, `undefined` for an empty source. */
  async #writeFile(
    file: FileNode,
    { storage, parsers, manifest, signal }: Pick<WriteOptions, 'storage' | 'parsers' | 'manifest' | 'signal'>,
  ): Promise<boolean | undefined> {
    signal?.throwIfAborted()
    const source = await this.parse(file, { parsers })
    if (!source) return undefined

    signal?.throwIfAborted()

    // Checking here rather than inside a driver gives a storage writing to S3 or a database
    // the same guarantee `fsStorage` has, that unchanged content is never rewritten.
    const stored = await storage.readItem(file.path)
    if (isUnchanged({ stored, source, key: file.path, manifest })) return false

    signal?.throwIfAborted()
    await storage.writeItem(file.path, source, { stored })

    // Only a file that was written can have been changed by the output passes.
    manifest?.track({ key: file.path, source })
    return true
  }
}
