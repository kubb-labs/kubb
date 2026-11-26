import type { FileNode } from '../nodes/file.ts'
import { createFileInliner } from './fileInliner.ts'
import type { InlineTextKind } from './nodeText.ts'

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

/**
 * The language-specific half of {@link inlineFiles}, supplied by the parser that prints the file.
 */
export type InlineLanguage = {
  /**
   * Swaps in what `replace` returns for every name in `text` that refers to something declared outside it. `kind` says what
   * the text holds, so a fragment such as a type or a parameter list can be read as one.
   */
  replaceIdentifiers(text: string, replace: (name: string) => string | undefined, kind?: InlineTextKind): string
  /**
   * Every name `text` declares or uses, so a declaration added next to it never shadows one. Without it, the names
   * `replaceIdentifiers` finds are used.
   */
  names?(text: string, kind?: InlineTextKind): Iterable<string>
  /**
   * Makes `expression` safe to put where a name was, such as `(A | B)` in TypeScript.
   */
  wrap(expression: string): string
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
    const inlined = createFileInliner({ file, lang, virtual }).inline()
    result.files.push(inlined.file)
    result.problems.push(...inlined.problems)
  }

  return result
}

// A file of only deprecated per-source `inline` counts as inline too.
function isInlineFile(file: FileNode): boolean {
  return !!file.inline || (file.sources.length > 0 && file.sources.every((source) => source.inline))
}
