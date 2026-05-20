import type { CodeNode, FileNode } from '@kubb/ast'
import { extractStringsFromNodes } from '@kubb/ast'
import { AsyncEventEmitter } from '@internals/utils'
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

  parse(file: FileNode, { parsers, extension }: ParseOptions = {}): string {
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

  [Symbol.dispose](): void {
    this.events.removeAll()
  }
}
