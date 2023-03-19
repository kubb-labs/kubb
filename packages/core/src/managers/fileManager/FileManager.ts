import uniq from 'lodash.uniq'
import { v4 as uuidv4 } from 'uuid'

import { write, read } from '../../utils'

import type { QueueTask, Queue } from '../../utils'
import type { CacheStore, UUID, Status, File } from './types'

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

  private getCacheByPath(path: string | undefined): CacheStore | undefined {
    let cache

    this.cache.forEach((item) => {
      if (item.file.path === path) {
        cache = item
      }
    })
    return cache as unknown as CacheStore
  }

  public getSource(file: File) {
    // TODO make generic check
    if (!file.fileName.endsWith('.ts')) {
      return file.source
    }
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
        return `${prev}\nimport ${curr.isTypeOnly ? 'type ' : ''}{ ${curr.name.join(', ')} } from "${curr.path}";`
      }

      return `${prev}\nimport ${curr.isTypeOnly ? 'type ' : ''}${curr.name} from "${curr.path}";`
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
    const previousCache = this.getCacheByPath(file.path)

    if (previousCache) {
      this.cache.delete(previousCache.id)
      return this.add({
        ...file,
        source: `${previousCache.file.source}\n${file.source}`,
        imports: [...(previousCache.file.imports || []), ...(file.imports || [])],
      })
    }
    return this.add(file)
  }

  combine(files: Array<File | null>) {
    return files.filter(Boolean).reduce((acc, curr: File | null) => {
      if (!curr) {
        return acc
      }
      const prevIndex = acc.findIndex((item) => item.path === curr.path)

      if (prevIndex !== -1) {
        const prev = acc[prevIndex]
        acc[prevIndex] = {
          ...curr,
          source: `${prev.source}\n${curr.source}`,
          imports: [...(prev.imports || []), ...(curr.imports || [])],
        }
      } else {
        acc.push(curr)
      }

      return acc
    }, [] as File[])
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
