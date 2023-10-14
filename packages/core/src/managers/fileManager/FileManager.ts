import crypto from 'node:crypto'

import { read, write } from '../../utils/index.ts'
import { extensions } from './utils.ts'

import type { Queue, QueueJob } from '../../utils/index.ts'
import type { CacheItem, KubbFile } from './types.ts'

export class FileManager {
  private cache: Map<KubbFile.Path, CacheItem[]> = new Map()

  private task?: QueueJob<KubbFile.ResolvedFile>

  private queue?: Queue

  constructor(options?: { queue?: Queue; task?: QueueJob<KubbFile.ResolvedFile> }) {
    if (options) {
      this.task = options.task
      this.queue = options.queue
    }
  }
  get extensions(): Array<KubbFile.Extname> {
    return extensions
  }

  get files(): Array<KubbFile.File> {
    const files: Array<KubbFile.File> = []
    this.cache.forEach((item) => {
      files.push(...item.flat(1))
    })

    return files
  }
  get isExecuting(): boolean {
    return this.queue?.hasJobs ?? false
  }

  async add(file: KubbFile.File): Promise<KubbFile.ResolvedFile> {
    const controller = new AbortController()
    const resolvedFile: KubbFile.ResolvedFile = { id: crypto.randomUUID(), ...file }

    this.cache.set(resolvedFile.path, [{ cancel: () => controller.abort(), ...resolvedFile }])

    if (this.queue) {
      try {
        await this.queue.run(
          async () => {
            return this.task?.(resolvedFile)
          },
          { controller },
        )
      } catch {
        return resolvedFile
      }
    }

    return resolvedFile
  }

  addOrAppend(file: KubbFile.File): Promise<KubbFile.ResolvedFile> {
    // if (!file.path.endsWith(file.fileName)) {
    //   console.warn(`Path ${file.path}(file.path) should end with the fileName ${file.fileName}(file.filename)`)
    // }

    const previousCaches = this.cache.get(file.path)
    const previousCache = previousCaches ? previousCaches.at(previousCaches.length - 1) : undefined

    if (previousCache) {
      this.cache.delete(previousCache.path)

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

  private append(path: KubbFile.Path, file: KubbFile.ResolvedFile): void {
    const previousFiles = this.cache.get(path) || []

    this.cache.set(path, [...previousFiles, file])
  }

  getCacheByUUID(UUID: KubbFile.UUID): KubbFile.File | undefined {
    let cache: KubbFile.File | undefined

    this.cache.forEach((files) => {
      cache = files.find((item) => item.id === UUID)
    })
    return cache
  }

  get(path: KubbFile.Path): Array<KubbFile.File> | undefined {
    return this.cache.get(path)
  }

  remove(path: KubbFile.Path): void {
    const cacheItem = this.get(path)
    if (!cacheItem) {
      return
    }

    this.cache.delete(path)
  }

  async write(...params: Parameters<typeof write>): Promise<void> {
    if (this.queue) {
      return this.queue.run(async () => {
        return write(...params)
      })
    }

    return write(...params)
  }

  async read(...params: Parameters<typeof read>): Promise<string> {
    if (this.queue) {
      return this.queue.run(async () => {
        return read(...params)
      })
    }

    return read(...params)
  }
}
