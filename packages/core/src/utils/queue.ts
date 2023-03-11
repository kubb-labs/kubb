/* eslint-disable no-cond-assign */

export interface QueueTask<T> {
  (...args: any): Promise<T>
}

interface QueueItem {
  reject: (reason?: unknown) => void
  resolve: (value: any) => void
  task: QueueTask<unknown>
}

export class Queue {
  private readonly queue: QueueItem[] = []

  workerCount = 0

  private maxParallel: number

  constructor(maxParallel: number) {
    this.maxParallel = maxParallel
  }

  run<T>(task: QueueTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ reject, resolve, task })
      this.work()
    })
  }

  private async work(): Promise<void> {
    if (this.workerCount >= this.maxParallel) return
    this.workerCount++

    let entry: QueueItem | undefined
    while ((entry = this.queue.shift())) {
      const { reject, resolve, task } = entry
      task()
        .then((result) => resolve(result))
        .catch((err) => reject(err))
    }

    this.workerCount--
  }
}
