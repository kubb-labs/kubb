import { AsyncEventEmitter } from '@internals/utils'
import type { CodeNode, FileNode } from '@kubb/ast'
import { extractStringsFromNodes } from '@kubb/ast'
import { STREAM_FLUSH_EVERY } from './constants.ts'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'

/**
 * Hooks fired by a `FileProcessor`.
 *
 * - `start` opens a batch, from `run` or a queue flush.
 * - `update` fires once per file as it is converted.
 * - `end` closes a batch.
 * - `enqueue` fires for every `enqueue` call.
 * - `drain` fires when `drain()` empties the queue with no in-flight batch left.
 */
export type FileProcessorHooks = {
  start: [files: Array<FileNode>]
  update: [params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }]
  end: [files: Array<FileNode>]
  enqueue: [file: FileNode]
  drain: []
}

/**
 * Per-file progress record yielded by `stream` and surfaced through the `update` event.
 */
export type ParsedFile = {
  file: FileNode
  source: string
  processed: number
  total: number
  percentage: number
}

type FileProcessorOptions = {
  /**
   * Storage destination for queued writes. Required for queue mode.
   */
  storage?: Storage
  /**
   * Parsers indexed by file extension.
   */
  parsers?: Map<FileNode['extname'], Parser>
  /**
   * Output extname per source extname, applied during conversion.
   */
  extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
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
 * Turns `FileNode`s into source strings and writes them to storage.
 *
 * Two modes share the same instance. Stateless mode (`parse`, `stream`, `run`) just runs the
 * conversion. Queue mode (`enqueue`, `flush`, `drain`) buffers files deduped by path and
 * writes each batch through storage with up to `STREAM_FLUSH_EVERY` requests in flight.
 *
 * `flush` does not wait for its batch to finish, so dispatch can overlap with IO. The next
 * `flush` or `drain` picks the in-flight batch up. `drain` blocks until everything has been
 * written and is meant for the end of a build.
 *
 * Queue mode needs `storage` in the constructor. To surface build-level hook signals
 * (`kubb:files:processing:*` and friends) subscribe to `hooks` and re-emit on the kubb bus.
 */
export class FileProcessor {
  readonly hooks = new AsyncEventEmitter<FileProcessorHooks>()
  readonly #parsers: Map<FileNode['extname'], Parser> | null
  readonly #storage: Storage | null
  readonly #extension: Record<FileNode['extname'], FileNode['extname'] | ''> | null
  readonly #pending = new Map<string, FileNode>()
  #inFlight: Promise<void> | null = null

  constructor(options: FileProcessorOptions = {}) {
    this.#parsers = options.parsers ?? null
    this.#storage = options.storage ?? null
    this.#extension = options.extension ?? null
  }

  /**
   * Files waiting in the queue.
   */
  get size(): number {
    return this.#pending.size
  }

  parse(file: FileNode): string {
    const parsers = this.#parsers
    const parseExtName = this.#extension?.[file.extname] || undefined

    if (!parsers || !file.extname) {
      return joinSources(file)
    }

    const parser = parsers.get(file.extname)

    if (!parser) {
      return joinSources(file)
    }

    return parser.parse(file, { extname: parseExtName })
  }

  *stream(files: ReadonlyArray<FileNode>): Generator<ParsedFile> {
    const total = files.length
    if (total === 0) return

    let processed = 0
    for (const file of files) {
      const source = this.parse(file)
      processed++

      yield { file, source, processed, total, percentage: (processed / total) * 100 }
    }
  }

  async run(files: Array<FileNode>): Promise<Array<FileNode>> {
    await this.hooks.emit('start', files)

    for (const { file, source, processed, total, percentage } of this.stream(files)) {
      await this.hooks.emit('update', { file, source, processed, percentage, total })
    }

    await this.hooks.emit('end', files)

    return files
  }

  /**
   * Adds a file to the next flush. A later `enqueue` for the same path replaces the previous
   * entry, matching `FileManager.upsert`. Fires the `enqueue` event.
   */
  enqueue(file: FileNode): void {
    this.#pending.set(file.path, file)
    this.hooks.emit('enqueue', file)
  }

  /**
   * Starts processing the queued files. Waits for any previous flush to finish (so two
   * batches never run together) and then returns without waiting for the new one. The next
   * `flush` or `drain` picks up the in-flight task.
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
   * Waits for the in-flight flush and writes any files still queued. Fires the `drain` event
   * when both are done.
   */
  async drain(): Promise<void> {
    this.#assertQueueMode()
    if (this.#inFlight) await this.#inFlight

    if (this.#pending.size > 0) {
      const batch = [...this.#pending.values()]
      this.#pending.clear()
      await this.#processAndWrite(batch)
    }

    await this.hooks.emit('drain')
  }

  #assertQueueMode(): void {
    if (!this.#storage) {
      throw new Error('FileProcessor was constructed without storage. Queue mode (enqueue / flush / drain) is unavailable.')
    }
  }

  async #processAndWrite(files: Array<FileNode>): Promise<void> {
    const storage = this.#storage!

    await this.hooks.emit('start', files)

    const items = [...this.stream(files)]
    for (const item of items) {
      await this.hooks.emit('update', item)
    }

    const queue: Array<Promise<void>> = []
    for (const { file, source } of items) {
      if (source) {
        queue.push(storage.setItem(file.path, source))
        if (queue.length >= STREAM_FLUSH_EVERY) await Promise.all(queue.splice(0))
      }
    }
    await Promise.all(queue)

    await this.hooks.emit('end', files)
  }

  /**
   * Clears every listener and the pending queue.
   */
  dispose(): void {
    this.hooks.removeAll()
    this.#pending.clear()
  }

  [Symbol.dispose](): void {
    this.dispose()
  }
}
