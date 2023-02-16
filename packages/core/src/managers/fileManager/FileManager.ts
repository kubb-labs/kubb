import EventEmitter from 'eventemitter3'
import uniq from 'lodash.uniq'
import { v4 as uuidv4 } from 'uuid'

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

  private getSource(file: File) {
    const imports: File['imports'] = []

    file.imports?.forEach((curr) => {
      const exists = imports.find((imp) => imp.path === curr.path)
      if (!exists) {
        imports.push(curr)
        return
      }

      if (exists && Array.isArray(curr.name)) {
        exists.name = uniq([...exists.name, ...curr.name])
      }
    })

    const importSource = imports.reduce((prev, curr) => {
      if (Array.isArray(curr.name)) {
        return `${prev}\nimport ${curr.type ? 'type ' : ''}{ ${curr.name.join(',')} } from "${curr.path}";`
      }

      return `${prev}\nimport ${curr.type ? 'type ' : ''}${curr.name} from "${curr.path}";`
    }, '')

    if (importSource) {
      return `${importSource}\n${file.source}`
    }

    return file.source
  }

  get files() {
    const files: File[] = []
    this.cache.forEach((item) => {
      files.push(item.file)
    })

    return files
  }

  add(file: File) {
    const cacheItem = { id: uuidv4(), file, status: 'new' as Status }

    this.cache.set(cacheItem.id, cacheItem)
    this.events.emitFile(cacheItem.id, file)

    return new Promise<File>((resolve) => {
      const unsubscribe = this.events.onRemove(cacheItem.id, (file) => {
        resolve(file)
        unsubscribe()
      })
    })
  }

  build(file: File) {
    return this.getSource(file)
  }

  addOrAppend(file: File) {
    const previousCache = this.getCacheByPath(file.path)

    if (previousCache) {
      this.remove(previousCache.id)
      return this.add({
        ...file,
        source: `${previousCache.file.source}\n${file.source}`,
        imports: [...(previousCache.file.imports || []), ...(file.imports || [])],
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
