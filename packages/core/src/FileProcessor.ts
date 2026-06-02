import { AsyncEventEmitter } from '@internals/utils'
import type { CodeNode, FileNode } from '@kubb/ast'
import { extractStringsFromNodes } from '@kubb/ast'
import { STREAM_FLUSH_EVERY } from './constants.ts'
import type { Config } from './createKubb.ts'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'

type ParseOptions = {
  parsers?: Map<FileNode['extname'], Parser>
  extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
}

/**
 * Events fired by a `FileProcessor` instance.
 *
 * - `start` opens a batch (via `run` or a flush from the queue).
 * - `update` fires once per file as it is converted to a source string.
 * - `end` closes a batch.
 * - `enqueue` fires once per `enqueue` call when the queue is in use.
 * - `drain` fires when `drain()` returns to an empty queue with no in-flight batch.
 */
export type FileProcessorEvents = {
  start: [files: Array<FileNode>]
  update: [params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }]
  end: [files: Array<FileNode>]
  enqueue: [file: FileNode]
  drain: []
}

export type ParsedFile = {
  file: FileNode
  source: string
  processed: number
  total: number
  percentage: number
}

type FileProcessorOptions = {
  /**
   * Storage destination for queued writes. Required if `enqueue` / `flush` / `drain` are used.
   */
  storage?: Storage
  /**
   * Active build config. Required if `enqueue` / `flush` / `drain` are used: the queue reads
   * `config.output.extension` when converting files. External callers that want a build-level
   * hook signal should listen on `events`.
   */
  config?: Config
  /**
   * Parsers indexed by file extension, applied during conversion.
   */
  parsers?: Map<FileNode['extname'], Parser>
}

function joinSources(file: FileNode): string {
  const sources = file.sources
  if (sources.length === 0) return ''
  const parts: Array<string> = []
  for (const source of sources) {
    const s = extractStringsFromNodes(source.nodes as Array<CodeNode>)
    if (s) parts.push(s)
  }
  return parts.join('\n\n')
}

/**
 * Owns the path between `FileNode` and the destination storage.
 *
 * In stateless mode (`parse`, `stream`, `run`) the processor converts files to source strings
 * via the registered parsers. In queue mode (`enqueue`, `flush`, `drain`) it also buffers files
 * deduped by path, then processes each batch through the parsers and writes the resulting
 * source to the configured storage with up to `STREAM_FLUSH_EVERY` requests in flight.
 *
 * `flush` is non-blocking after the first batch. It awaits any previous flush still running
 * but returns immediately after kicking off the new one, so the next round of generator
 * dispatch overlaps with the previous round's source rendering and storage IO. `drain` blocks
 * until everything has been written and is meant for the end of a build.
 *
 * Queue mode requires `storage` and `config` in the constructor. Callers that want build-level
 * hook signals (such as `kubb:files:processing:*`) should subscribe to `events` and re-emit
 * them on their own hook bus. Calling `enqueue` / `flush` / `drain` without `storage` and
 * `config` throws.
 */
export class FileProcessor {
  readonly events = new AsyncEventEmitter<FileProcessorEvents>()
  readonly #parsers: Map<FileNode['extname'], Parser> | null
  readonly #storage: Storage | null
  readonly #config: Config | null
  readonly #pending = new Map<string, FileNode>()
  #inFlight: Promise<void> | null = null

  constructor(options: FileProcessorOptions = {}) {
    this.#parsers = options.parsers ?? null
    this.#storage = options.storage ?? null
    this.#config = options.config ?? null
  }

  /**
   * Number of files currently waiting to be processed and written.
   */
  get size(): number {
    return this.#pending.size
  }

  parse(file: FileNode, { parsers, extension }: ParseOptions = {}): string {
    const effectiveParsers = parsers ?? this.#parsers ?? undefined
    const parseExtName = extension?.[file.extname] || undefined

    if (!effectiveParsers || !file.extname) {
      return joinSources(file)
    }

    const parser = effectiveParsers.get(file.extname)

    if (!parser) {
      return joinSources(file)
    }

    return parser.parse(file, { extname: parseExtName })
  }

  *stream(files: ReadonlyArray<FileNode>, options: ParseOptions = {}): Generator<ParsedFile> {
    const total = files.length
    if (total === 0) return

    let processed = 0
    for (const file of files) {
      const source = this.parse(file, options)
      processed++

      yield { file, source, processed, total, percentage: (processed / total) * 100 }
    }
  }

  async run(files: Array<FileNode>, options: ParseOptions = {}): Promise<Array<FileNode>> {
    await this.events.emit('start', files)

    for (const { file, source, processed, total, percentage } of this.stream(files, options)) {
      await this.events.emit('update', { file, source, processed, percentage, total })
    }

    await this.events.emit('end', files)

    return files
  }

  /**
   * Queues a file for the next flush. Repeated calls for the same path replace the previous
   * entry, matching `FileManager.upsert` semantics. Fires the `enqueue` event.
   */
  enqueue(file: FileNode): void {
    this.#pending.set(file.path, file)
    this.events.emit('enqueue', file)
  }

  /**
   * Kicks off processing for the currently-pending files. Waits for any previous in-flight
   * flush to finish first (so two batches are never being processed concurrently), then
   * returns without waiting for the new batch. The next call to `flush` or `drain` picks up
   * that in-flight task.
   */
  async flush(): Promise<void> {
    this.#assertQueueMode()
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
   * Fires the `drain` event when both the in-flight and pending batches are done.
   */
  async drain(): Promise<void> {
    this.#assertQueueMode()
    if (this.#inFlight) await this.#inFlight

    if (this.#pending.size > 0) {
      const batch = [...this.#pending.values()]
      this.#pending.clear()
      await this.#processAndWrite(batch)
    }

    await this.events.emit('drain')
  }

  #assertQueueMode(): void {
    if (!this.#storage || !this.#config) {
      throw new Error('FileProcessor was constructed without storage or config. Queue mode (enqueue / flush / drain) is unavailable.')
    }
  }

  async #processAndWrite(files: Array<FileNode>): Promise<void> {
    const storage = this.#storage!
    const config = this.#config!

    await this.events.emit('start', files)

    const items = [...this.stream(files, { parsers: this.#parsers ?? undefined, extension: config.output.extension })]
    for (const item of items) {
      await this.events.emit('update', item)
    }

    const queue: Array<Promise<void>> = []
    for (const { file, source } of items) {
      if (source) {
        queue.push(storage.setItem(file.path, source))
        if (queue.length >= STREAM_FLUSH_EVERY) await Promise.all(queue.splice(0))
      }
    }
    await Promise.all(queue)

    await this.events.emit('end', files)
  }

  /**
   * Clears all registered event listeners and the pending queue.
   */
  dispose(): void {
    this.events.removeAll()
    this.#pending.clear()
  }

  [Symbol.dispose](): void {
    this.dispose()
  }
}
