import type { FileNode } from '../nodes/file.ts'
import { inlineFile } from './fileInliner.ts'
import { createVirtualFiles } from './virtualFiles.ts'
import type { InlineLanguage } from './virtualFiles.ts'

export type { InlineLanguage, InlineTextKind, InlineUse } from './virtualFiles.ts'

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
 * Moves what a file imports from a virtual file (one marked `inline`, so it is never written) into that file. A type used more
 * than once becomes one local, non-exported declaration. A type used once, a bare alias, and a value are written at each use.
 * The moved declarations' own imports move to the importing file.
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { language }: InlineFilesOptions): InlineFilesResult {
  const virtual = createVirtualFiles(files)
  const result: InlineFilesResult = { files: [], virtualPaths: virtual.paths, problems: virtual.problems }
  if (virtual.paths.length === 0) return result

  for (const file of files) {
    if (virtual.has(file.path) || !file.imports.some((imp) => virtual.has(imp.path))) continue

    const lang = language(file)
    if (!lang) {
      virtual.report(file.path, `No parser for "${file.extname}" files supports inline sources.`)
      continue
    }
    result.files.push(inlineFile({ file, lang, virtual }))
  }

  return result
}
