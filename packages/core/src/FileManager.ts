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
}

type WriteOptions = ParseOptions & {
  storage: Storage
}

// Cap how many files are parsed and written at once. A small spec runs all its files in parallel;
// a spec with thousands of files keeps at most this many parsed sources in memory instead of every
// source at once, while each file's write still overlaps the next file's parse. Disk writes are
// throttled separately inside `fsStorage`.
const WRITE_CONCURRENCY = 50

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

// An existing path replaces its slot in place; a new path lands at the tail of its tie group,
// where a stable full re-sort would put it.
function insertSorted(sorted: Array<FileNode>, file: FileNode): void {
  const index = sorted.findIndex((existing) => existing.path === file.path || compareFiles(existing, file) > 0)
  if (index === -1) {
    sorted.push(file)
    return
  }
  if (sorted[index]!.path === file.path) {
    sorted[index] = file
    return
  }
  sorted.splice(index, 0, file)
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
  // Files written since `#sorted` was last computed, merged in on the next `files` read.
  readonly #pending = new Map<string, FileNode>()
  // Cached sorted view. Each recompute is a new array, never mutated in place, so a caller
  // holding a prior reference keeps its snapshot.
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
      this.#pending.set(merged.path, merged)
      resolved.push(merged)
    }

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
    this.#pending.clear()
    this.#sorted = null
  }

  /**
   * Releases all stored files and clears every `hooks` listener. Called by the core after
   * `kubb:build:end`.
   */
  dispose(): void {
    this.clear()
    this.hooks.removeAllHooks()
  }

  /**
   * All stored files in stable sort order (shortest path first, barrel files
   * last within a length bucket). Returns a cached view, do not mutate.
   */
  get files(): Array<FileNode> {
    if (this.#sorted === null) {
      this.#sorted = [...this.#cache.values()].sort(compareFiles)
      this.#pending.clear()
      return this.#sorted
    }

    if (this.#pending.size === 0) return this.#sorted

    const next = [...this.#sorted]
    for (const file of this.#pending.values()) insertSorted(next, file)
    this.#sorted = next
    this.#pending.clear()

    return this.#sorted
  }

  /**
   * Converts a file's AST sources (or its `copy` source) into the final on-disk string.
   */
  async parse(file: FileNode, { parsers }: ParseOptions = {}): Promise<string> {
    if (file.copy) {
      return parseCopy(file)
    }

    if (!parsers || !file.extname) {
      return joinSources(file)
    }

    const parser = parsers.get(file.extname)

    if (!parser) {
      return joinSources(file)
    }

    return parser.parse(file)
  }

  /**
   * Parses and writes every file through a bounded pool of workers. A small spec runs all its files
   * at once; a spec with thousands of files keeps at most `WRITE_CONCURRENCY` parsed sources in
   * memory rather than holding every source, while still overlapping each file's write with the
   * next file's parse. Each `update` carries the file's input position, so a consumer can present
   * the files in generation order even though they finish in whatever order they parse.
   */
  async write(files: Array<FileNode>, { storage, parsers }: WriteOptions): Promise<void> {
    if (files.length === 0) return

    await this.hooks.callHook('start', files)

    const total = files.length
    // Workers share one iterator, so each `next()` hands the next file to whichever worker is free.
    const entries = files.entries()

    const worker = async (): Promise<void> => {
      for (const [index, file] of entries) {
        const source = await this.parse(file, { parsers })
        await this.hooks.callHook('update', { file, source, processed: index + 1, total, percentage: ((index + 1) / total) * 100 })
        if (source) await storage.setItem(file.path, source)
      }
    }

    await Promise.all(Array.from({ length: Math.min(WRITE_CONCURRENCY, total) }, () => worker()))

    await this.hooks.callHook('end', files)
  }
}
