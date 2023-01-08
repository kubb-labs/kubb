import EventEmitter from 'events'
import { randomUUID } from 'crypto'

import { getFileManagerEvents } from './events'

import { write, read } from '../../utils'

import type { CacheStore, UUID, Status, File } from './types'

export class FileManager {
  private cache: Map<CacheStore['id'], CacheStore> = new Map()

  emitter = new EventEmitter()

  events = getFileManagerEvents(this.emitter)

  constructor() {
    this.events.onStatusChange(() => {
      if (this.getCountByStatus('removed') === this.cache.size) {
        // all files are been resolved and written to the file system
        this.events.emitSuccess()
      }
    })
  }

  private getCache(id: UUID) {
    return this.cache.get(id)
  }

  private getCacheByPath(path: string | undefined): CacheStore | undefined {
    let cache

    this.cache.forEach((item) => {
      if (item.file.path === path) {
        cache = item
      }
    })
    return cache as CacheStore
  }

  private getCountByStatus(status: Status) {
    let count = 0

    this.cache.forEach((item) => {
      if (item.status === status) {
        count++
      }
    })
    return count
  }

  get files() {
    const files: File[] = []
    this.cache.forEach((item) => {
      files.push(item.file)
    })

    return files
  }

  add(file: File) {
    const cacheItem = { id: randomUUID(), file, status: 'new' as Status }

    this.cache.set(cacheItem.id, cacheItem)
    this.events.emitFile(cacheItem.id, file)

    return new Promise<File>((resolve) => {
      const unsubscribe = this.events.onRemove(cacheItem.id, (file) => {
        resolve(file)
        unsubscribe()
      })
    })
  }

  addOrAppend(file: File) {
    const previousCache = this.getCacheByPath(file.path)

    if (previousCache) {
      this.remove(previousCache.id)
      return this.add({
        ...file,
        source: `${previousCache.file.source}\n${file.source}`,
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
    this.events.emitStatusChange(cacheItem.file)
    this.events.emitStatusChangeById(id, status)
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
    this.events.emitRemove(id, cacheItem.file)
  }

  async write(...params: Parameters<typeof write>) {
    return write(...params)
  }

  async read(...params: Parameters<typeof read>) {
    return read(...params)
  }
}
