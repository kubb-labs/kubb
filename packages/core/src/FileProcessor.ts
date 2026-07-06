import { read } from '@internals/utils'
import { extractStringsFromNodes, type CodeNode, type FileNode } from '@kubb/ast'
import { STREAM_FLUSH_EVERY } from './constants.ts'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'
import { AsyncEventEmitter } from './asyncEventEmitter.ts'

/**
 * Hooks fired by a `FileProcessor`.
 *
 * - `start` opens a batch on a queue flush.
 * - `update` fires once per file as it is converted.
 * - `end` closes a batch.
 */
export type FileProcessorHooks = {
  start: [files: Array<FileNode>]
  update: [params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }]
  end: [files: Array<FileNode>]
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
   * Storage destination for queued writes.
   */
  storage: Storage
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
  return file.sources
    .map((source) => extractStringsFromNodes(source.nodes as Array<CodeNode>))
    .filter(Boolean)
    .join('\n\n')
}

async function parseCopy(file: FileNode): Promise<string> {
  let content: string
  try {
    content = await read(file.copy as string)
  } catch (err) {
    throw new Error(`[kubb] Could not copy file into output: ${file.copy}`, { cause: err })
  }

  return [file.banner, content, file.footer]
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => segment.trimEnd())
    .join('\n')
}

/**
 * Turns `FileNode`s into source strings and writes them to storage.
 *
 * Two modes share the same instance. Stateless mode (`parse`, `stream`) just runs the
 * conversion. Queue mode (`enqueue`, `drain`) buffers files deduped by path and writes them
 * in self-scheduling batches, with up to `STREAM_FLUSH_EVERY` storage requests in flight
 * per batch.
 *
 * The first `enqueue` starts a batch right away. Files enqueued while a batch is writing
 * collect into the next one, which starts as soon as the current batch finishes, so writes
 * continuously trail generation without the caller pacing anything. `drain` blocks until
 * the queue is empty and is meant for the end of a build.
 *
 * To surface build-level hook signals (`kubb:files:processing:*` and friends) subscribe to
 * `hooks` and re-emit on the kubb bus.
 */
export class FileProcessor {
  readonly hooks = new AsyncEventEmitter<FileProcessorHooks>()
  readonly #parsers: Map<FileNode['extname'], Parser> | null
  readonly #storage: Storage
  readonly #extension: Record<FileNode['extname'], FileNode['extname'] | ''> | null
  readonly #pending = new Map<string, FileNode>()
  #runningBatch: Promise<void> | null = null
  #writeError: unknown = null

  constructor(options: FileProcessorOptions) {
    this.#parsers = options.parsers ?? null
    this.#storage = options.storage
    this.#extension = options.extension ?? null
  }

  async parse(file: FileNode): Promise<string> {
    if (file.copy) {
      return parseCopy(file)
    }

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

  async *stream(files: ReadonlyArray<FileNode>): AsyncGenerator<ParsedFile> {
    const total = files.length
    if (total === 0) return

    let processed = 0
    for (const file of files) {
      const source = await this.parse(file)
      processed++

      yield { file, source, processed, total, percentage: (processed / total) * 100 }
    }
  }

  /**
   * Adds a file to the write queue and starts a batch when none is running. A later
   * `enqueue` for the same path replaces the previous entry, matching `FileManager.upsert`.
   */
  enqueue(file: FileNode): void {
    this.#pending.set(file.path, file)
    this.#kick()
  }

  // Starts the next batch unless one is running or a previous batch failed. Called again
  // from the batch's finally, so the queue keeps draining on its own while the caller
  // generates more files. A batch failure parks its error for `drain` and stops the queue.
  #kick(): void {
    if (this.#runningBatch || this.#writeError !== null || this.#pending.size === 0) return

    const batch = [...this.#pending.values()]
    this.#pending.clear()

    this.#runningBatch = this.#processAndWrite(batch)
      .catch((error: unknown) => {
        this.#writeError = error
      })
      .finally(() => {
        this.#runningBatch = null
        this.#kick()
      })
  }

  /**
   * Waits until every queued file has been written, then rethrows the first batch error
   * when one occurred.
   */
  async drain(): Promise<void> {
    while (this.#runningBatch) await this.#runningBatch

    if (this.#writeError !== null) {
      const error = this.#writeError
      this.#writeError = null
      throw error
    }
  }

  async #processAndWrite(files: Array<FileNode>): Promise<void> {
    const storage = this.#storage

    await this.hooks.emit('start', files)

    // Single pass: each file's write starts right after its `update` fires, so IO overlaps
    // parsing and the batch never holds every rendered source in memory at once.
    const queue: Array<Promise<void>> = []
    for await (const item of this.stream(files)) {
      await this.hooks.emit('update', item)
      if (item.source) {
        queue.push(storage.setItem(item.file.path, item.source))
        if (queue.length >= STREAM_FLUSH_EVERY) await Promise.all(queue.splice(0))
      }
    }
    await Promise.all(queue)

    await this.hooks.emit('end', files)
  }
}
