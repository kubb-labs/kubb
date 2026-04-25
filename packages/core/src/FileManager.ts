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

/**
 * Collapses a list of files so that duplicates sharing the same `path` are merged
 * in arrival order. Keeps the original order of first occurrence.
 */
function mergeFilesByPath(files: ReadonlyArray<FileNode>): Map<string, FileNode> {
  const merged = new Map<string, FileNode>()
  for (const file of files) {
    const existing = merged.get(file.path)
    merged.set(file.path, existing ? mergeFile(existing, file) : file)
  }
  return merged
}

/**
 * In-memory file store for generated files.
 *
 * Files with the same `path` are merged — sources, imports, and exports are concatenated.
 * The `files` getter returns all stored files sorted by path length (shortest first).
 *
 * @example
 * ```ts
 * import { FileManager } from '@kubb/core'
 *
 * const manager = new FileManager()
 * manager.upsert(myFile)
 * console.log(manager.files) // all stored files
 * ```
 */
export class FileManager {
  readonly #cache = new Map<string, FileNode>()
  #filesCache: Array<FileNode> | null = null

  /**
   * Adds one or more files. Incoming files with the same path are merged
   * (sources/imports/exports concatenated), but existing cache entries are
   * replaced — use {@link upsert} when you want to merge into the cache too.
   */
  add(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, false)
  }

  /**
   * Adds or merges one or more files.
   * If a file with the same path already exists in the cache, its
   * sources/imports/exports are merged into the incoming file.
   */
  upsert(...files: Array<FileNode>): Array<FileNode> {
    return this.#store(files, true)
  }

  #store(files: ReadonlyArray<FileNode>, mergeExisting: boolean): Array<FileNode> {
    const resolvedFiles: Array<FileNode> = []
    for (const file of mergeFilesByPath(files).values()) {
      const existing = mergeExisting ? this.#cache.get(file.path) : undefined
      const resolvedFile = createFile(existing ? mergeFile(existing, file) : file)
      this.#cache.set(resolvedFile.path, resolvedFile)
      resolvedFiles.push(resolvedFile)
    }
    this.#filesCache = null
    return resolvedFiles
  }

  getByPath(path: string): FileNode | null {
    return this.#cache.get(path) ?? null
  }

  deleteByPath(path: string): void {
    this.#cache.delete(path)
    this.#filesCache = null
  }

  clear(): void {
    this.#cache.clear()
    this.#filesCache = null
  }

  /**
   * All stored files, sorted by path length (shorter paths first).
   */
  get files(): Array<FileNode> {
    if (this.#filesCache) {
      return this.#filesCache
    }

    this.#filesCache = [...this.#cache.values()].sort((a, b) => {
      const lenDiff = a.path.length - b.path.length
      if (lenDiff !== 0) return lenDiff
      // Within the same length bucket, index.ts barrel files go last so other
      // files are always processed before their barrel file.
      const aIsIndex = a.path.endsWith('/index.ts') || a.path === 'index.ts'
      const bIsIndex = b.path.endsWith('/index.ts') || b.path === 'index.ts'
      if (aIsIndex && !bIsIndex) return 1
      if (!aIsIndex && bIsIndex) return -1
      return 0
    })
    return this.#filesCache
  }
}
