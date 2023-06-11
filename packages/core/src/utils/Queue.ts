export type QueueTask<T = unknown> = {
  (...args: unknown[]): Promise<T>
}

interface QueueItem {
  reject: <T>(reason?: T) => void
  resolve: <T>(value: T | PromiseLike<T>) => void
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
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem = { reject, resolve, task } as QueueItem
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
      const { reject, resolve, task } = entry
      task()
        .then((result) => resolve(result))
        .catch((err) => reject(err))
    }

    this.workerCount--
  }
}
