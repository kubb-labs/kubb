import { v4 as uuidv4 } from 'uuid'

import { write, read } from '../../utils/index.js'

import type { QueueTask, Queue } from '../../utils/index.js'
import type { CacheStore, UUID, Status, File } from './types.js'

export class FileManager {
  private cache: Map<CacheStore['id'], CacheStore> = new Map()

  private task?: QueueTask<unknown>

  private queue?: Queue

  constructor(options?: { queue: Queue; task: QueueTask<unknown> }) {
    if (options) {
      this.task = options.task
      this.queue = options.queue
    }
  }

  private getCache(id: UUID) {
    return this.cache.get(id)
  }

  getCacheByPath(path: string | undefined): CacheStore | undefined {
    let cache

    this.cache.forEach((item) => {
      if (item.file.path === path) {
        cache = item
      }
    })
    return cache as unknown as CacheStore
  }

  get files() {
    const files: File[] = []
    this.cache.forEach((item) => {
      files.push(item.file)
    })

    return files
  }

  async add(file: File) {
    const cacheItem = { id: uuidv4(), file, status: 'new' as Status }

    this.cache.set(cacheItem.id, cacheItem)

    if (this.queue) {
      await this.queue.run(async () => {
        await this.task?.(cacheItem.id, file)
      })
    }

    return file
  }

  addOrAppend(file: File) {
    if (!file.path.endsWith(file.fileName)) {
      // console.warn(`Path ${file.path}(file.path) should end with the fileName ${file.fileName}(file.filename)`)
    }

    const previousCache = this.getCacheByPath(file.path)

    if (previousCache) {
      // empty source will also return true when using includes
      const sourceAlreadyExists = file.source && previousCache.file.source.includes(file.source)

      if (sourceAlreadyExists) {
        return Promise.resolve(file)
      }

      this.cache.delete(previousCache.id)

      return this.add({
        ...file,
        source: `${previousCache.file.source}\n${file.source}`,
        imports: [...(previousCache.file.imports || []), ...(file.imports || [])],
        exports: [...(previousCache.file.exports || []), ...(file.exports || [])],
      })
    }
    return this.add(file)
  }

  setStatus(id: UUID, status: Status) {
    const cacheItem = this.getCache(id)
    if (!cacheItem) {
      return
    }

    cacheItem.status = status
    this.cache.set(id, cacheItem)
  }

  get(id: UUID) {
    const cacheItem = this.getCache(id)
    return cacheItem?.file
  }

  remove(id: UUID) {
    const cacheItem = this.getCache(id)
    if (!cacheItem) {
      return
    }

    this.setStatus(id, 'removed')
  }

  async write(...params: Parameters<typeof write>) {
    return write(...params)
  }

  async read(...params: Parameters<typeof read>) {
    return read(...params)
  }
}
