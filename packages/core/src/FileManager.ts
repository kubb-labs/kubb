import type { FileNode } from '@kubb/ast'
import { createFile } from '@kubb/ast'

function mergeFile<TMeta extends object = object>(a: FileNode<TMeta>, b: FileNode<TMeta>): FileNode<TMeta> {
  return {
    ...a,
    sources: [...(a.sources || []), ...(b.sources || [])],
    imports: [...(a.imports || []), ...(b.imports || [])],
    exports: [...(a.exports || []), ...(b.exports || [])],
  }
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
   * Adds one or more files. Files with the same path are merged — sources, imports,
   * and exports from all calls with the same path are concatenated together.
   */
  add(...files: Array<FileNode>): Array<FileNode> {
    const resolvedFiles: Array<FileNode> = []
    const mergedFiles = new Map<string, FileNode>()

    for (const file of files) {
      const existing = mergedFiles.get(file.path)
      mergedFiles.set(file.path, existing ? mergeFile(existing, file) : file)
    }

    for (const file of mergedFiles.values()) {
      const resolvedFile = createFile(file)
      this.#cache.set(resolvedFile.path, resolvedFile)
      resolvedFiles.push(resolvedFile)
    }
    this.#filesCache = null

    return resolvedFiles
  }

  /**
   * Adds or merges one or more files.
   * If a file with the same path already exists, its sources/imports/exports are merged together.
   */
  upsert(...files: Array<FileNode>): Array<FileNode> {
    const resolvedFiles: Array<FileNode> = []
    const mergedFiles = new Map<string, FileNode>()

    for (const file of files) {
      const existing = mergedFiles.get(file.path)
      mergedFiles.set(file.path, existing ? mergeFile(existing, file) : file)
    }

    for (const file of mergedFiles.values()) {
      const existing = this.#cache.get(file.path)
      const merged = existing ? mergeFile(existing, file) : file
      const resolvedFile = createFile(merged)
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

    this.#filesCache = [...this.#cache.values()].sort((a, b) => a.path.length - b.path.length)
    return this.#filesCache
  }
}
