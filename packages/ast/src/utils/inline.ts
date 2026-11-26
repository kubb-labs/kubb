import type { FileNode } from '../nodes/file.ts'
import { createFileInliner } from './fileInliner.ts'
import type { InlineLanguage } from './fileInliner.ts'

export type { InlineLanguage } from './fileInliner.ts'
export type { InlineTextKind } from './nodeText.ts'

export type InlineFilesResult = {
  /**
   * Files that imported an inline name, rewritten to hold its definition.
   */
  files: Array<FileNode>
  /**
   * Paths of the virtual files, which are not written.
   */
  virtualPaths: Array<string>
  /**
   * One message per name that could not be inlined.
   */
  problems: Array<{ path: string; message: string }>
}

export type InlineFilesOptions = {
  /**
   * The inline support for a file's language, or `undefined` when it has none.
   */
  language: (file: FileNode) => InlineLanguage | undefined
}

/**
 * Moves what a file imports from a virtual file (one marked `inline`, so it is never written) into that file. A value, and a
 * type used more than once, becomes one local, non-exported declaration. A type used once or a bare name is written in place.
 * The moved declarations' own imports move to the importing file.
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { language }: InlineFilesOptions): InlineFilesResult {
  const virtual = new Map(files.filter(isInlineFile).map((file) => [file.path, file]))
  const result: InlineFilesResult = { files: [], virtualPaths: [...virtual.keys()], problems: [] }

  for (const file of files) {
    if (virtual.has(file.path) || !file.imports.some((imp) => virtual.has(imp.path))) continue

    const lang = language(file)
    if (!lang) {
      result.problems.push({ path: file.path, message: `No parser for "${file.extname}" files supports inline sources.` })
      continue
    }
    result.files.push(createFileInliner({ file, lang, virtual, problems: result.problems }).inline())
  }

  return result
}

// A file of only deprecated per-source `inline` counts as inline too.
function isInlineFile(file: FileNode): boolean {
  return !!file.inline || (file.sources.length > 0 && file.sources.every((source) => source.inline))
}
