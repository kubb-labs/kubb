import type { CodeNode, FileNode } from '@kubb/ast'
import { extractStringsFromNodes } from '@kubb/ast'
import {AsyncEventEmitter, isPromise} from '@internals/utils'
import type { Parser } from './defineParser.ts'

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

  /**
   * Returns the parser's result as-is — synchronous parsers (e.g. the default
   * `parserTs`) return a string directly, async parsers return a Promise.
   * The caller handles both via {@link isPromise}.
   */
  parse(file: FileNode, { parsers, extension }: ParseOptions = {}): string | Promise<string> {
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
   * Streams parsed files in input order, yielding each as soon as the parser
   * for that file resolves. Synchronous parsers (the common case for `.ts`
   * output) flow through without any Promise wrapping; an async parser stalls
   * just that file's await without a microtask cost on the rest.
   */
  async *stream(files: ReadonlyArray<FileNode>, options: ParseOptions = {}): AsyncGenerator<ParsedFile> {
    const total = files.length
    if (total === 0) return

    let processed = 0
    for (const file of files) {
      const result = this.parse(file, options)
      const source = isPromise<string>(result) ? await result : result
      processed++
      yield { file, source, processed, total, percentage: (processed / total) * 100 }
    }
  }

  /**
   * Synchronous variant of {@link stream}. Iterating is a plain `for` loop and
   * no microtask is paid per file. Throws if any registered parser is async
   * (returns a Promise) — callers that may have async parsers should use the
   * async {@link stream} instead.
   */
  *streamSync(files: ReadonlyArray<FileNode>, options: ParseOptions = {}): Generator<ParsedFile> {
    const total = files.length
    if (total === 0) return

    let processed = 0
    for (const file of files) {
      const result = this.parse(file, options)
      if (isPromise<string>(result)) {
        throw new Error(`FileProcessor.streamSync: parser for '${file.extname}' returned a Promise; use stream() for async parsers`)
      }
      processed++
      yield { file, source: result, processed, total, percentage: (processed / total) * 100 }
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
