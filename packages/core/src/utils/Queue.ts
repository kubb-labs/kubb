import crypto from 'node:crypto'
import { performance } from 'node:perf_hooks'

export type QueueJob<T = unknown> = {
  (...args: unknown[]): Promise<T> | Promise<void>
}

type RunOptions = {
  controller?: AbortController
  name?: string
  description?: string
}

type QueueItem = {
  reject: <T>(reason?: T) => void
  resolve: <T>(value: T | PromiseLike<T>) => void
  job: QueueJob<unknown>
} & Required<RunOptions>

export class Queue {
  private queue: QueueItem[] = []

  private workerCount = 0

  private maxParallel: number
  private debug = false

  constructor(maxParallel: number, debug = false) {
    this.maxParallel = maxParallel
    this.debug = debug
  }

  run<T>(job: QueueJob<T>, options: RunOptions = { controller: new AbortController(), name: crypto.randomUUID(), description: '' }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item = { reject, resolve, job, name: options.name, description: options.description || options.name } as QueueItem

      options.controller?.signal.addEventListener('abort', () => {
        this.queue = this.queue.filter((queueItem) => queueItem.name === item.name)

        reject('Aborted')
      })

      this.queue.push(item)
      this.work()
    })
  }

  runSync<T>(job: QueueJob<T>, options: RunOptions = { controller: new AbortController(), name: crypto.randomUUID(), description: '' }): void {
    new Promise<T>((resolve, reject) => {
      const item = { reject, resolve, job, name: options.name, description: options.description || options.name } as QueueItem

      options.controller?.signal.addEventListener('abort', () => {
        this.queue = this.queue.filter((queueItem) => queueItem.name === item.name)
      })

      this.queue.push(item)
      this.work()
    })
  }

  get hasJobs(): boolean {
    return this.workerCount > 0 || this.queue.length > 0
  }

  get count(): number {
    return this.workerCount
  }

  private work(): void {
    if (this.workerCount >= this.maxParallel) {
      return
    }
    this.workerCount++

    let entry: QueueItem | undefined
    while ((entry = this.queue.shift())) {
      const { reject, resolve, job, name, description } = entry
      if (this.debug) {
        performance.mark(name + '_start')
      }

      job()
        .then((result) => {
          resolve(result)

          if (this.debug) {
            performance.mark(name + '_stop')
            performance.measure(description, name + '_start', name + '_stop')
          }
        })
        .catch((err) => reject(err))
    }

    this.workerCount--
  }
}
