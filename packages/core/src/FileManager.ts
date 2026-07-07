import { read } from '@internals/utils'
import { ast, extractStringsFromNodes, type CodeNode, type FileNode } from '@kubb/ast'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'
import { Hookable } from './Hookable.ts'

/**
 * Hooks fired around a `FileManager#write` batch: `start` before it, `update` per file, `end` after.
 */
export type FileManagerHooks = {
  start: [files: Array<FileNode>]
  update: [params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }]
  end: [files: Array<FileNode>]
}

type ParseOptions = {
  parsers?: Map<FileNode['extname'], Parser>
  extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
}

type WriteOptions = ParseOptions & {
  storage: Storage
}

function joinSources(file: FileNode): string {
  return file.sources
    .map((source) => extractStringsFromNodes(source.nodes as Array<CodeNode>))
    .filter(Boolean)
    .join('\n\n')
}

async function parseCopy(file: FileNode): Promise<string> {
  let content: string
  try {
    content = await read(file.copy as string)
  } catch (err) {
    throw new Error(`[kubb] Could not copy file into output: ${file.copy}`, { cause: err })
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
  const lenDiff = a.path.length - b.path.length
  if (lenDiff !== 0) return lenDiff
  const aIsIndex = isIndexPath(a.path)
  const bIsIndex = isIndexPath(b.path)
  if (aIsIndex && !bIsIndex) return 1
  if (!aIsIndex && bIsIndex) return -1

  return 0
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
  readonly hooks = new Hookable<FileManagerHooks>()
  readonly #cache = new Map<string, FileNode>()
  // Cached sorted view. Null means stale and rebuilt lazily on next `files` read.
  // Nulled (not mutated) on every write so callers holding a prior reference keep
  // their snapshot. `dispose()` must not silently empty an array the consumer
  // already holds.
  #sorted: Array<FileNode> | null = null

  add(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, false)
  }

  upsert(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, true)
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

  // Merges same-path entries within a batch so the cache update loop stays
  // uniform. Only called for multi-file batches.
  #dedupe(files: ReadonlyArray<FileNode>): Array<FileNode> {
    const seen = new Map<string, FileNode>()
    for (const file of files) {
      const prev = seen.get(file.path)
      seen.set(file.path, prev ? mergeFile(prev, file) : file)
    }
    return [...seen.values()]
  }

  clear(): void {
    this.#cache.clear()
    this.#sorted = null
  }

  /**
   * Releases all stored files and clears every `hooks` listener. Called by the core after
   * `kubb:build:end`.
   */
  dispose(): void {
    this.clear()
    this.hooks.removeAll()
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
  async parse(file: FileNode, { parsers, extension }: ParseOptions = {}): Promise<string> {
    if (file.copy) {
      return parseCopy(file)
    }

    const parseExtName = extension?.[file.extname] || undefined

    if (!parsers || !file.extname) {
      return joinSources(file)
    }

    const parser = parsers.get(file.extname)

    if (!parser) {
      return joinSources(file)
    }

    return parser.parse(file, { extname: parseExtName })
  }

  /**
   * Converts and writes every file at once, letting `storage.setItem` decide how much of
   * that runs concurrently.
   */
  async write(files: Array<FileNode>, { storage, parsers, extension }: WriteOptions): Promise<void> {
    if (files.length === 0) return

    await this.hooks.emit('start', files)

    const total = files.length
    let processed = 0
    await Promise.all(
      files.map(async (file) => {
        const source = await this.parse(file, { parsers, extension })
        processed++
        await this.hooks.emit('update', { file, source, processed, total, percentage: (processed / total) * 100 })
        if (source) await storage.setItem(file.path, source)
      }),
    )

    await this.hooks.emit('end', files)
  }
}
