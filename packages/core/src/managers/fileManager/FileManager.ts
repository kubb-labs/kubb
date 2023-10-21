import crypto from 'node:crypto'

import { read, write } from '../../utils/index.ts'
import { extensions, getIndexes } from './utils.ts'

import type { Queue, QueueJob, TreeNodeOptions } from '../../utils/index.ts'
import type { CacheItem, KubbFile } from './types.ts'

export class FileManager {
  #cache: Map<KubbFile.Path, CacheItem[]> = new Map()

  #task?: QueueJob<KubbFile.ResolvedFile>

  #queue?: Queue

  constructor(options?: { queue?: Queue; task?: QueueJob<KubbFile.ResolvedFile> }) {
    if (options) {
      this.#task = options.task
      this.#queue = options.queue
    }
  }
  get extensions(): Array<KubbFile.Extname> {
    return extensions
  }

  get files(): Array<KubbFile.File> {
    const files: Array<KubbFile.File> = []
    this.#cache.forEach((item) => {
      files.push(...item.flat(1))
    })

    return files
  }
  get isExecuting(): boolean {
    return this.#queue?.hasJobs ?? false
  }

  async add(file: KubbFile.File): Promise<KubbFile.ResolvedFile> {
    const controller = new AbortController()
    const resolvedFile: KubbFile.ResolvedFile = { id: crypto.randomUUID(), ...file }

    this.#cache.set(resolvedFile.path, [{ cancel: () => controller.abort(), ...resolvedFile }])

    if (this.#queue) {
      try {
        await this.#queue.run(
          async () => {
            return this.#task?.(resolvedFile)
          },
          { controller },
        )
      } catch {
        return resolvedFile
      }
    }

    return resolvedFile
  }

  async addOrAppend(file: KubbFile.File): Promise<KubbFile.ResolvedFile> {
    // if (!file.path.endsWith(file.baseName)) {
    //   console.warn(`Path ${file.path}(file.path) should end with the baseName ${file.baseName}(file.filename)`)
    // }

    const previousCaches = this.#cache.get(file.path)
    const previousCache = previousCaches ? previousCaches.at(previousCaches.length - 1) : undefined

    if (previousCache) {
      this.#cache.delete(previousCache.path)

      return this.add({
        ...file,
        source: previousCache.source && file.source ? `${previousCache.source}\n${file.source}` : '',
        imports: [...(previousCache.imports || []), ...(file.imports || [])],
        exports: [...(previousCache.exports || []), ...(file.exports || [])],
        env: { ...(previousCache.env || {}), ...(file.env || {}) },
      })
    }
    return this.add(file)
  }

  async addIndexes(root: KubbFile.Path, extName: KubbFile.Extname = '.ts', options: TreeNodeOptions = {}): Promise<Array<KubbFile.File> | undefined> {
    const files = await getIndexes(root, extName, options)

    if (!files) {
      return undefined
    }

    return Promise.all(
      files.map((file) => {
        if (file.override) {
          return this.add(file)
        }

        return this.addOrAppend(file)
      }),
    )
  }

  #append(path: KubbFile.Path, file: KubbFile.ResolvedFile): void {
    const previousFiles = this.#cache.get(path) || []

    this.#cache.set(path, [...previousFiles, file])
  }

  getCacheByUUID(UUID: KubbFile.UUID): KubbFile.File | undefined {
    let cache: KubbFile.File | undefined

    this.#cache.forEach((files) => {
      cache = files.find((item) => item.id === UUID)
    })
    return cache
  }

  get(path: KubbFile.Path): Array<KubbFile.File> | undefined {
    return this.#cache.get(path)
  }

  remove(path: KubbFile.Path): void {
    const cacheItem = this.get(path)
    if (!cacheItem) {
      return
    }

    this.#cache.delete(path)
  }

  async write(...params: Parameters<typeof write>): Promise<void> {
    if (this.#queue) {
      return this.#queue.run(async () => {
        return write(...params)
      })
    }

    return write(...params)
  }

  async read(...params: Parameters<typeof read>): Promise<string> {
    if (this.#queue) {
      return this.#queue.run(async () => {
        return read(...params)
      })
    }

    return read(...params)
  }
}
