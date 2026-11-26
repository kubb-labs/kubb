import type { FileNode } from '@kubb/ast'
import type { InlineResult } from '@kubb/core'
import type { Lang } from './inline.ts'
import { createFileRewriter } from './fileRewriter.ts'
import { createDefinitions } from './definitions.ts'

export type InlineFilesResult = InlineResult

/**
 * Moves what a file imports from a virtual file (one marked `inline`, so it is never written) into that file. A value, and a
 * type used more than once, becomes one local, non-exported declaration. A type used once or a bare name is written in place.
 * The moved declarations' own imports move to the importing file. Only files with one of `extNames` are rewritten.
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { lang, extNames }: { lang: Lang; extNames: ReadonlyArray<string> }): InlineFilesResult {
  const virtual = new Map(files.filter(isInlineFile).map((file) => [file.path, file]))
  const result: InlineFilesResult = { files: [], virtualPaths: [...virtual.keys()], problems: [] }
  // Shared by every file, so each virtual body is read once per run.
  const definitions = createDefinitions(virtual, lang)

  for (const file of files) {
    if (!extNames.includes(file.extname) || virtual.has(file.path) || !file.imports.some((imp) => virtual.has(imp.path))) continue

    const inlined = createFileRewriter(file, definitions).rewrite()
    result.files.push(inlined.file)
    result.problems.push(...inlined.problems)
  }

  return result
}

// A file of only deprecated per-source `inline` counts as inline too.
function isInlineFile(file: FileNode): boolean {
  return !!file.inline || (file.sources.length > 0 && file.sources.every((source) => source.inline))
}
