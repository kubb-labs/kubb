import { Worker } from 'node:worker_threads'

type Job = { id: number; path: string; content: string }

type JobResult = {
  id: number
  error?: { message: string; stack?: string; code?: string; errno?: number; syscall?: string; path?: string }
}

type Thread = {
  worker: Worker
  queue: Array<Job>
  pending: Map<number, { resolve: () => void; reject: (error: Error) => void }>
  idleTimer?: NodeJS.Timeout
}

/**
 * Runs inside each worker, kept as source text so it ships inside the ESM and CJS bundles without a
 * separate entry file to resolve. `getBuiltinModule` works whether the worker inherits
 * `--input-type=module` or not.
 */
const workerSource = `
const { parentPort } = process.getBuiltinModule('node:worker_threads')
const { mkdirSync, writeFileSync } = process.getBuiltinModule('node:fs')
const { dirname } = process.getBuiltinModule('node:path')

function write(path, content) {
  try {
    writeFileSync(path, content, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content, 'utf8')
  }
}

parentPort.on('message', (jobs) => {
  parentPort.postMessage(jobs.map(({ id, path, content }) => {
    try {
      write(path, content)
      return { id }
    } catch (error) {
      const { message, stack, code, errno, syscall } = error
      return { id, error: { message, stack, code, errno, syscall, path: error.path } }
    }
  }))
})
`

/** Two threads keep the disk busy while the main thread prints; more only add startup cost. */
const THREAD_COUNT = 2
/** How long an idle thread lingers before it exits, so back-to-back builds in watch mode reuse it. */
const IDLE_MS = 1000

function toError(error: NonNullable<JobResult['error']>): Error {
  const { message, stack, ...fields } = error
  return Object.assign(new Error(message), stack ? { stack } : {}, fields)
}

/**
 * Pool of worker threads that write files for `fsStorage`, so the main thread only prints and
 * compares sources. Compare-reads stay on the main thread, where a small sync read beats a round
 * trip. Jobs queued in the same tick go out as one message per thread. A thread is unref'd while it
 * has nothing pending and exits after {@link IDLE_MS}, so it never keeps the process alive.
 */
function createFsWorkers({ size = THREAD_COUNT, idleMs = IDLE_MS }: { size?: number; idleMs?: number } = {}) {
  const threads: Array<Thread | undefined> = []
  let nextId = 0
  let nextThread = 0

  function close(thread: Thread | undefined, reason: Error): void {
    if (!thread) return
    const index = threads.indexOf(thread)
    if (index === -1) return
    threads[index] = undefined
    clearTimeout(thread.idleTimer)
    for (const { reject } of thread.pending.values()) reject(reason)
    void thread.worker.terminate()
  }

  function spawn(index: number): Thread {
    const worker = new Worker(workerSource, { eval: true })
    const thread: Thread = { worker, queue: [], pending: new Map() }
    worker.on('message', (results: Array<JobResult>) => {
      for (const { id, error } of results) {
        const job = thread.pending.get(id)
        thread.pending.delete(id)
        if (error) job?.reject(toError(error))
        if (!error) job?.resolve()
      }
      if (thread.pending.size > 0) return
      worker.unref()
      thread.idleTimer = setTimeout(() => close(thread, new Error('fsStorage worker closed')), idleMs).unref()
    })
    worker.on('error', (error) => close(thread, error))
    worker.on('exit', (code) => close(thread, new Error(`fsStorage worker stopped with exit code ${code}`)))
    threads[index] = thread
    return thread
  }

  function write(path: string, content: string): Promise<void> {
    const index = nextThread
    nextThread = (nextThread + 1) % size
    const thread = threads[index] ?? spawn(index)
    const id = nextId++
    clearTimeout(thread.idleTimer)
    if (thread.pending.size === 0) thread.worker.ref()
    if (thread.queue.length === 0) {
      setImmediate(() => {
        const jobs = thread.queue
        thread.queue = []
        thread.worker.postMessage(jobs)
      })
    }
    thread.queue.push({ id, path, content })
    return new Promise((resolve, reject) => thread.pending.set(id, { resolve, reject }))
  }

  return {
    /** Writes `content` to `path` verbatim, creating missing parent directories. */
    write,
    /** Number of threads currently running. */
    get size(): number {
      return threads.filter(Boolean).length
    },
    /** Stops every thread, rejecting jobs still in flight. */
    close: (): void => {
      for (const thread of [...threads]) close(thread, new Error('fsStorage worker closed'))
    },
  }
}

export type FsWorkers = ReturnType<typeof createFsWorkers>

let shared: FsWorkers | undefined

/** The process-wide pool every `fsStorage` instance shares, created on first use. */
export function getFsWorkers(): FsWorkers {
  shared ??= createFsWorkers()
  return shared
}

export { createFsWorkers }
