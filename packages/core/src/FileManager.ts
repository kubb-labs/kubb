import { AsyncEventEmitter } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { createFile } from '@kubb/ast'

/**
 * Hooks fired by a `FileManager`.
 *
 * - `upsert` fires once per resolved file added through `add` or `upsert`.
 */
export type FileManagerHooks = {
  upsert: [file: FileNode]
}

function mergeFile<TMeta extends object = object>(a: FileNode<TMeta>, b: FileNode<TMeta>): FileNode<TMeta> {
  return {
    ...a,
    // Incoming file (b) takes precedence for banner/footer so a barrel file (whose
    // banner/footer the barrel plugin resolves last) wins over a plugin-generated
    // file at the same path.
    banner: b.banner,
    footer: b.footer,
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
 * In-memory file store for generated files. Files sharing a `path` are merged
 * (sources/imports/exports concatenated). The `files` getter is sorted by
 * path length (barrel `index.ts` last within a bucket).
 *
 * @example
 * ```ts
 * const manager = new FileManager()
 * manager.upsert(myFile)
 * manager.files // sorted view
 * ```
 */
export class FileManager {
  /**
   * Subscribe to file-store changes. Listeners on `upsert` see each resolved file as it lands
   * through `add` or `upsert`.
   */
  readonly hooks = new AsyncEventEmitter<FileManagerHooks>()
  readonly #cache = new Map<string, FileNode>()
  // Cached sorted view. Null means stale and rebuilt lazily on next `files` read.
  // Nulled (not mutated) on every write so callers holding a prior reference
  // keep their snapshot, `dispose()` must not silently empty an array the
  // consumer already holds.
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
      const merged = existing && mergeExisting ? createFile(mergeFile(existing, file)) : createFile(file)
      this.#cache.set(merged.path, merged)
      resolved.push(merged)
      this.hooks.emit('upsert', merged)
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

  getByPath(path: string): FileNode | null {
    return this.#cache.get(path) ?? null
  }

  deleteByPath(path: string): void {
    if (!this.#cache.delete(path)) return
    this.#sorted = null
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

  [Symbol.dispose](): void {
    this.dispose()
  }

  /**
   * All stored files in stable sort order (shortest path first, barrel files
   * last within a length bucket). Returns a cached view, do not mutate.
   */
  get files(): Array<FileNode> {
    return (this.#sorted ??= [...this.#cache.values()].sort(compareFiles))
  }
}
