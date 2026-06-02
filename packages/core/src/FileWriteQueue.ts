import type { AsyncEventEmitter } from '@internals/utils'
import type { FileNode } from '@kubb/ast'
import { STREAM_FLUSH_EVERY } from './constants.ts'
import type { Config } from './createKubb.ts'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'
import type { FileProcessor } from './FileProcessor.ts'
import type { KubbHooks } from './types.ts'

type FileWriteQueueOptions = {
  processor: FileProcessor
  parsers: Map<FileNode['extname'], Parser>
  storage: Storage
  hooks: AsyncEventEmitter<KubbHooks>
  config: Config
}

/**
 * Buffered writer between the file manager and the configured storage.
 *
 * Files queued via `enqueue` are deduped by path and processed in batches: the
 * `FileProcessor` turns each `FileNode` into a source string, then the storage write happens
 * with up to `STREAM_FLUSH_EVERY` requests in flight.
 *
 * `flush` is non-blocking after the first batch. It awaits any previous flush still running
 * but returns immediately after kicking off the new one, so the next round of generator
 * dispatch can overlap with the previous round's source rendering and storage IO. `drain`
 * blocks until everything has been written and is meant for the end of the build.
 */
export class FileWriteQueue {
  readonly #pending = new Map<string, FileNode>()
  readonly #processor: FileProcessor
  readonly #parsers: Map<FileNode['extname'], Parser>
  readonly #storage: Storage
  readonly #hooks: AsyncEventEmitter<KubbHooks>
  readonly #config: Config
  #inFlight: Promise<void> | null = null

  constructor(options: FileWriteQueueOptions) {
    this.#processor = options.processor
    this.#parsers = options.parsers
    this.#storage = options.storage
    this.#hooks = options.hooks
    this.#config = options.config
  }

  /**
   * Number of files currently waiting to be processed and written.
   */
  get size(): number {
    return this.#pending.size
  }

  /**
   * Queues a file for the next flush. Repeated calls for the same path replace the previous
   * entry, matching `FileManager.upsert` semantics.
   */
  enqueue(file: FileNode): void {
    this.#pending.set(file.path, file)
  }

  /**
   * Kicks off processing for the currently-pending files. Waits for any previous in-flight
   * flush to finish first (so two batches are never being processed concurrently), then
   * returns without waiting for the new batch. The next call to `flush` or `drain` picks up
   * that in-flight task.
   */
  async flush(): Promise<void> {
    if (this.#inFlight) await this.#inFlight
    if (this.#pending.size === 0) return

    const batch = [...this.#pending.values()]
    this.#pending.clear()

    this.#inFlight = this.#processAndWrite(batch).finally(() => {
      this.#inFlight = null
    })
  }

  /**
   * Waits for any in-flight flush and then processes and writes any remaining queued files.
   * Call this at the end of the build to make sure nothing is dropped.
   */
  async drain(): Promise<void> {
    if (this.#inFlight) await this.#inFlight
    if (this.#pending.size === 0) return

    const batch = [...this.#pending.values()]
    this.#pending.clear()
    await this.#processAndWrite(batch)
  }

  async #processAndWrite(files: Array<FileNode>): Promise<void> {
    const config = this.#config

    await this.#hooks.emit('kubb:debug', { date: new Date(), logs: [`Writing ${files.length} files...`] })
    await this.#hooks.emit('kubb:files:processing:start', { files })

    const items = [...this.#processor.stream(files, { parsers: this.#parsers, extension: config.output.extension })]

    await this.#hooks.emit('kubb:files:processing:update', {
      files: items.map(({ file, source, processed, total, percentage }) => ({ file, source, processed, total, percentage, config })),
    })

    const queue: Array<Promise<void>> = []
    for (const { file, source } of items) {
      if (source) {
        queue.push(this.#storage.setItem(file.path, source))
        if (queue.length >= STREAM_FLUSH_EVERY) await Promise.all(queue.splice(0))
      }
    }
    await Promise.all(queue)

    await this.#hooks.emit('kubb:files:processing:end', { files })
    await this.#hooks.emit('kubb:debug', { date: new Date(), logs: [`✓ File write process completed for ${files.length} files`] })
  }
}
