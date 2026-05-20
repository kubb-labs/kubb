import type { FileNode } from '@kubb/ast'
import { createFile } from '@kubb/ast'

function mergeFile<TMeta extends object = object>(a: FileNode<TMeta>, b: FileNode<TMeta>): FileNode<TMeta> {
  return {
    ...a,
    // Incoming file (b) takes precedence for banner/footer so that barrel files,
    // which never carry a banner, can clear banners set by plugin-generated files
    // at the same path.
    banner: b.banner,
    footer: b.footer,
    sources: [...(a.sources || []), ...(b.sources || [])],
    imports: [...(a.imports || []), ...(b.imports || [])],
    exports: [...(a.exports || []), ...(b.exports || [])],
  }
}

function mergeFilesByPath(files: ReadonlyArray<FileNode>): Map<string, FileNode> {
  const merged = new Map<string, FileNode>()
  for (const file of files) {
    const existing = merged.get(file.path)
    merged.set(file.path, existing ? mergeFile(existing, file) : file)
  }
  return merged
}

function isIndexPath(path: string): boolean {
  return path.endsWith('/index.ts') || path === 'index.ts'
}

// Sort order: shortest path first; within a length bucket, index.ts barrels last.
function compareFiles(a: FileNode, b: FileNode): number {
  const lenDiff = a.path.length - b.path.length
  if (lenDiff !== 0) return lenDiff
  const aIsIndex = isIndexPath(a.path)
  const bIsIndex = isIndexPath(b.path)
  if (aIsIndex && !bIsIndex) return 1
  if (!aIsIndex && bIsIndex) return -1
  return 0
}

function binaryInsert(sorted: Array<FileNode>, file: FileNode): void {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (compareFiles(sorted[mid]!, file) <= 0) lo = mid + 1
    else hi = mid
  }
  sorted.splice(lo, 0, file)
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
  readonly #cache = new Map<string, FileNode>()
  // Sorted view maintained incrementally on insert / replace / delete so the
  // `files` getter is O(1) and no full re-sort runs between upserts. Reassigned
  // (not mutated in place) on clear so that callers holding a reference from a
  // previous getter call keep their snapshot — the post-build `dispose()` must
  // not silently empty an array the consumer already returned.
  #sorted: Array<FileNode> = []
  #onUpsert: ((file: FileNode) => void) | undefined

  /**
   * Registers a callback invoked with the resolved {@link FileNode} on every
   * `add` / `upsert`. Used by the build loop to track newly written files
   * without keeping its own scan-based diff. Single subscriber by design —
   * setting again replaces the previous callback. Pass `undefined` to detach.
   */
  setOnUpsert(callback: ((file: FileNode) => void) | undefined): void {
    this.#onUpsert = callback
  }

  add(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, false)
  }

  upsert(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, true)
  }

  #store(files: ReadonlyArray<FileNode>, mergeExisting: boolean): Array<FileNode> {
    const resolved: Array<FileNode> = []
    for (const file of mergeFilesByPath(files).values()) {
      const existing = this.#cache.get(file.path)
      const merged = createFile(existing && mergeExisting ? mergeFile(existing, file) : file)
      this.#cache.set(merged.path, merged)

      if (existing) {
        // Same path → same sort position; replace in place rather than re-sort.
        const idx = this.#sorted.indexOf(existing)
        if (idx !== -1) this.#sorted[idx] = merged
        else binaryInsert(this.#sorted, merged)
      } else {
        binaryInsert(this.#sorted, merged)
      }

      resolved.push(merged)
      this.#onUpsert?.(merged)
    }
    return resolved
  }

  getByPath(path: string): FileNode | null {
    return this.#cache.get(path) ?? null
  }

  deleteByPath(path: string): void {
    const existing = this.#cache.get(path)
    if (!existing) return
    this.#cache.delete(path)
    const idx = this.#sorted.indexOf(existing)
    if (idx !== -1) this.#sorted.splice(idx, 1)
  }

  clear(): void {
    this.#cache.clear()
    this.#sorted = []
  }

  /**
   * Releases all stored files. Called by the core after `kubb:build:end`.
   */
  dispose(): void {
    this.clear()
    this.#onUpsert = undefined
  }

  [Symbol.dispose](): void {
    this.dispose()
  }

  /**
   * All stored files in stable sort order (shortest path first, barrel files
   * last within a length bucket). Returns a live view — do not mutate.
   */
  get files(): Array<FileNode> {
    return this.#sorted
  }
}
