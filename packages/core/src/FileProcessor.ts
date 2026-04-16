import type { CodeNode, FileNode } from '@kubb/ast'
import { extractStringsFromNodes } from '@kubb/ast'
import pLimit from 'p-limit'
import { PARALLEL_CONCURRENCY_LIMIT } from './constants.ts'
import type { Parser } from './defineParser.ts'

type ParseOptions = {
  parsers?: Map<FileNode['extname'], Parser>
  extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
}

type RunOptions = ParseOptions & {
  /**
   * @default 'sequential'
   */
  mode?: 'sequential' | 'parallel'
  onStart?: (files: Array<FileNode>) => Promise<void> | void
  onEnd?: (files: Array<FileNode>) => Promise<void> | void
  onUpdate?: (params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }) => Promise<void> | void
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
 */
export class FileProcessor {
  readonly #limit = pLimit(PARALLEL_CONCURRENCY_LIMIT)

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

  async run(files: Array<FileNode>, { parsers, mode = 'sequential', extension, onStart, onEnd, onUpdate }: RunOptions = {}): Promise<Array<FileNode>> {
    await onStart?.(files)

    const total = files.length
    let processed = 0

    const processOne = async (file: FileNode) => {
      const source = await this.parse(file, { extension, parsers })
      const currentProcessed = ++processed
      const percentage = (currentProcessed / total) * 100

      await onUpdate?.({
        file,
        source,
        processed: currentProcessed,
        percentage,
        total,
      })
    }

    if (mode === 'sequential') {
      for (const file of files) {
        await processOne(file)
      }
    } else {
      await Promise.all(files.map((file) => this.#limit(() => processOne(file))))
    }

    await onEnd?.(files)

    return files
  }
}
