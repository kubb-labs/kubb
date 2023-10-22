import crypto from 'node:crypto'

import { read, timeout, write } from '../../utils/index.ts'
import { extensions, getIndexes } from './utils.ts'

import type { Queue, QueueJob } from '../../utils/index.ts'
import type { CacheItem, KubbFile } from './types.ts'
import type { IndexesOptions } from './utils.ts'

type AddIndexesProps = {
  root: KubbFile.Path
  extName?: KubbFile.Extname
  options?: IndexesOptions
  meta?: KubbFile.File['meta']
}

export class FileManager {
  #cache: Map<KubbFile.Path, CacheItem[]> = new Map()

  #task?: QueueJob<KubbFile.ResolvedFile>
  #isWriting = false

  #queue?: Queue

  constructor(options?: { queue?: Queue; task?: QueueJob<KubbFile.ResolvedFile> }) {
    if (options) {
      this.#task = options.task
      this.#queue = options.queue
    }

    return this
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
      await this.#queue.run(
        async () => {
          return this.#task?.(resolvedFile)
        },
        { controller },
      )
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

  async addIndexes({ root, extName = '.ts', meta, options = {} }: AddIndexesProps): Promise<Array<KubbFile.File> | undefined> {
    const files = getIndexes(root, extName, options)

    if (!files) {
      return undefined
    }

    const result = await Promise.all(
      files.map((file) => {
        return this.addOrAppend({
          ...file,
          meta: meta ? meta : file.meta,
        })
      }),
    )

    // console.log({result: JSON.stringify(result, undefined,2)})

    return result
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

  async write(...params: Parameters<typeof write>): Promise<string | undefined> {
    if (!this.#isWriting) {
      this.#isWriting = true

      const text = await write(...params)

      this.#isWriting = false
      return text
    }

    await timeout(0)

    return this.write(...params)
  }

  async read(...params: Parameters<typeof read>): Promise<string> {
    return read(...params)
  }
}
