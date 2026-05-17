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
  return file.sources
    .map((item) => extractStringsFromNodes(item.nodes as Array<CodeNode>))
    .filter(Boolean)
    .join('\n\n')
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
   * Streams parsed files one at a time as each is processed.
   *
   * Unlike `run()`, files are yielded immediately after parsing rather than batched.
   * Storage writes can begin as soon as the first file is ready, keeping peak
   * memory proportional to one file at a time instead of the full batch.
   */
  async *runStream(files: ReadonlyArray<FileNode>, options: ParseOptions = {}): AsyncGenerator<ParsedFile> {
    const total = files.length
    let processed = 0

    for (const file of files) {
      const source = await this.parse(file, options)
      processed++
      yield { file, source, processed, total, percentage: (processed / total) * 100 }
    }
  }

  async run(files: Array<FileNode>, options: ParseOptions = {}): Promise<Array<FileNode>> {
    await this.events.emit('start', files)

    for await (const { file, source, processed, total, percentage } of this.runStream(files, options)) {
      await this.events.emit('update', { file, source, processed, percentage, total })
    }

    await this.events.emit('end', files)

    return files
  }
}
