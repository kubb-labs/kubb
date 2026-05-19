import type { CodeNode, FileNode } from '@kubb/ast'
import { extractStringsFromNodes } from '@kubb/ast'
import { AsyncEventEmitter } from '@internals/utils'
import type { Parser } from './defineParser.ts'

/**
 * Hard cap on concurrent file parses. Each in-flight parse holds one parsed
 * source string (tens of KB on large specs); 4 in flight keeps peak memory
 * within ~+1 MB of the sequential baseline.
 */
const CONCURRENCY = 4

type ParseOptions = {
  parsers?: Map<FileNode['extname'], Parser>
  extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
}

export type FileProcessorEvents = {
  start: [files: Array<FileNode>]
  update: [params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }]
  end: [files: Array<FileNode>]
}

export type ParsedFile = {
  file: FileNode
  source: string
  processed: number
  total: number
  percentage: number
}

function joinSources(file: FileNode): string {
  const sources = file.sources
  if (sources.length === 0) return ''
  const parts: string[] = []
  for (const source of sources) {
    const s = extractStringsFromNodes(source.nodes as Array<CodeNode>)
    if (s) parts.push(s)
  }
  return parts.join('\n\n')
}

/**
 * Converts a single file to a string using the registered parsers.
 * Falls back to joining source values when no matching parser is found.
 *
 * @internal
 */
export class FileProcessor {
  readonly events = new AsyncEventEmitter<FileProcessorEvents>()

  async parse(file: FileNode, { parsers, extension }: ParseOptions = {}): Promise<string> {
    const parseExtName = extension?.[file.extname] || undefined

    if (!parsers || !file.extname) {
      return joinSources(file)
    }

    const parser = parsers.get(file.extname)

    if (!parser) {
      return joinSources(file)
    }

    return parser.parse(file, { extname: parseExtName })
  }

  /**
   * Streams parsed files as each one finishes parsing.
   *
   * Up to {@link CONCURRENCY} files are parsed in parallel; results are yielded in
   * completion order rather than input order so storage writes can begin as soon
   * as the first file is ready. The concurrency cap keeps peak memory bounded —
   * only a handful of in-flight parsed source strings exist at any moment.
   */
  async *stream(files: ReadonlyArray<FileNode>, options: ParseOptions = {}): AsyncGenerator<ParsedFile> {
    const total = files.length
    if (total === 0) return

    const concurrency = Math.min(CONCURRENCY, total)
    let next = 0
    let processed = 0
    const inflight = new Map<number, Promise<{ idx: number; file: FileNode; source: string }>>()

    const start = (idx: number): void => {
      const file = files[idx]!
      inflight.set(
        idx,
        this.parse(file, options).then((source) => ({ idx, file, source })),
      )
    }

    for (let i = 0; i < concurrency; i++) start(next++)

    while (inflight.size > 0) {
      const { idx, file, source } = await Promise.race(inflight.values())
      inflight.delete(idx)
      processed++
      yield { file, source, processed, total, percentage: (processed / total) * 100 }
      if (next < total) start(next++)
    }
  }

  async run(files: Array<FileNode>, options: ParseOptions = {}): Promise<Array<FileNode>> {
    await this.events.emit('start', files)

    for await (const { file, source, processed, total, percentage } of this.stream(files, options)) {
      await this.events.emit('update', { file, source, processed, percentage, total })
    }

    await this.events.emit('end', files)

    return files
  }
}
