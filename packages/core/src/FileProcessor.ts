import { read } from '@internals/utils'
import { extractStringsFromNodes, type CodeNode, type FileNode } from '@kubb/ast'
import type { Storage } from './createStorage.ts'
import type { Parser } from './defineParser.ts'
import { AsyncEventEmitter } from './asyncEventEmitter.ts'

/**
 * Hooks fired around a `FileProcessor#write` batch: `start` before it, `update` per file, `end` after.
 */
export type FileProcessorHooks = {
  start: [files: Array<FileNode>]
  update: [params: { file: FileNode; source?: string; processed: number; total: number; percentage: number }]
  end: [files: Array<FileNode>]
}

type FileProcessorOptions = {
  storage: Storage
  parsers?: Map<FileNode['extname'], Parser>
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
 */
export class FileProcessor {
  readonly hooks = new AsyncEventEmitter<FileProcessorHooks>()
  readonly #parsers: Map<FileNode['extname'], Parser> | null
  readonly #storage: Storage
  readonly #extension: Record<FileNode['extname'], FileNode['extname'] | ''> | null

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

  /**
   * Converts and writes every file at once, letting `storage.setItem` decide how much of
   * that runs concurrently.
   */
  async write(files: Array<FileNode>): Promise<void> {
    if (files.length === 0) return

    await this.hooks.emit('start', files)

    const total = files.length
    let processed = 0
    await Promise.all(
      files.map(async (file) => {
        const source = await this.parse(file)
        processed++
        await this.hooks.emit('update', { file, source, processed, total, percentage: (processed / total) * 100 })
        if (source) await this.#storage.setItem(file.path, source)
      }),
    )

    await this.hooks.emit('end', files)
  }
}
