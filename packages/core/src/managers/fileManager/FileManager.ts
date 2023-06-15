import crypto from 'node:crypto'

import { read, write } from '../../utils/index.ts'
import type { Extension } from './utils.ts'
import { extensions } from './utils.ts'

import type { Queue, QueueTask } from '../../utils/index.ts'
import type { File, ResolvedFile, UUID } from './types.ts'
import type { Path } from '../../types.ts'

export class FileManager {
  private cache: Map<Path, ResolvedFile[]> = new Map()

  private task?: QueueTask<ResolvedFile>

  private queue?: Queue

  constructor(options?: { queue: Queue; task?: QueueTask<ResolvedFile> }) {
    if (options) {
      this.task = options.task
      this.queue = options.queue
    }
  }
  get extensions(): Extension[] {
    return extensions
  }

  get files(): File[] {
    const files: File[] = []
    this.cache.forEach((item) => {
      files.push(...item.flat(1))
    })

    return files
  }

  async add(file: File): Promise<ResolvedFile> {
    const resolvedFile = { id: crypto.randomUUID(), ...file }

    this.cache.set(resolvedFile.path, [resolvedFile])

    if (this.queue) {
      await this.queue.run(async () => {
        await this.task?.(resolvedFile)
      })
    }

    return resolvedFile
  }

  addOrAppend(file: File): Promise<ResolvedFile> {
    // if (!file.path.endsWith(file.fileName)) {
    //   console.warn(`Path ${file.path}(file.path) should end with the fileName ${file.fileName}(file.filename)`)
    // }

    const previousCaches = this.cache.get(file.path)
    const previousCache = previousCaches ? previousCaches.at(previousCaches.length - 1) : undefined

    if (previousCache) {
      // empty source will also return true when using includes
      const sourceAlreadyExists = file.source && previousCache.source.includes(file.source)

      if (sourceAlreadyExists) {
        return Promise.resolve(previousCache)
      }

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

  private append(path: Path, file: ResolvedFile): void {
    const previousFiles = this.cache.get(path) || []

    this.cache.set(path, [...previousFiles, file])
  }

  getCacheByUUID(UUID: UUID): File | undefined {
    let cache: File | undefined

    this.cache.forEach((files) => {
      cache = files.find((item) => item.id === UUID)
    })
    return cache
  }

  get(path: Path): File[] | undefined {
    return this.cache.get(path)
  }

  remove(path: Path): void {
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
