import crypto from 'node:crypto'
import { performance } from 'node:perf_hooks'

export type QueueTask<T = unknown> = {
  (...args: unknown[]): Promise<T> | Promise<void>
}

type RunOptions = {
  name: string
  description: string
}

type QueueItem = {
  reject: <T>(reason?: T) => void
  resolve: <T>(value: T | PromiseLike<T>) => void
  task: QueueTask<unknown>
} & RunOptions

export class Queue {
  private readonly queue: QueueItem[] = []

  workerCount = 0

  private maxParallel: number
  private debug = false

  constructor(maxParallel: number, debug = false) {
    this.maxParallel = maxParallel
    this.debug = debug
  }

  run<T>(task: QueueTask<T>, options: RunOptions = { name: crypto.randomUUID(), description: '' }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item = { reject, resolve, task, name: options.name, description: options.description || options.name } as QueueItem

      this.queue.push(item)
      this.work()
    })
  }

  private work(): void {
    if (this.workerCount >= this.maxParallel) {
      return
    }
    this.workerCount++

    let entry: QueueItem | undefined
    while ((entry = this.queue.shift())) {
      const { reject, resolve, task, name, description } = entry
      if (this.debug) {
        performance.mark(name + '_start')
      }

      task()
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
