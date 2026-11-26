import type { FileNode, InlineLanguage } from '@kubb/ast'
import type { InlineHook, InlineResult } from '@kubb/core'
import { createDefinitions } from './definitions.ts'
import { rewriteFile } from './fileRewriter.ts'
import { replaceIdentifiers, wrap, type Lang } from './inline.ts'

export type InlineOptions = {
  lang: Lang
  // Only files with one of these extensions are rewritten.
  extNames: ReadonlyArray<string>
}

/**
 * The parser's `inline` hook for `lang`. It also carries the deprecated `InlineLanguage` members, so a `@kubb/core` from
 * before the hook, which reads `inline` as an object, still inlines these files.
 *
 * @example
 * ```ts
 * const inline = createInline({ lang: 'ts', extNames: ['.ts', '.js'] })
 * inline(files) // { files, virtualPaths, problems }
 * ```
 */
export function createInline({ lang, extNames }: InlineOptions): InlineHook & InlineLanguage {
  const language: InlineLanguage = {
    replaceIdentifiers(text, replace) {
      return replaceIdentifiers(text, replace, lang)
    },
    wrap,
  }
  return Object.assign((files: ReadonlyArray<FileNode>) => inlineFiles({ files, lang, extNames }), language)
}

/**
 * Moves what a file imports from a virtual file (one marked `inline`, so it is never written) into that file. A value, and a
 * type used more than once, becomes one local, non-exported declaration. A type used once or a bare name is written in place.
 * The moved declarations' own imports move to the importing file.
 */
export function inlineFiles({ files, lang, extNames }: InlineOptions & { files: ReadonlyArray<FileNode> }): InlineResult {
  const virtual = new Map(files.filter(isInlineFile).map((file) => [file.path, file]))
  const result: InlineResult = { files: [], virtualPaths: [...virtual.keys()], problems: [] }
  // Shared by every file, so each virtual body is read once per run.
  const definitions = createDefinitions({ virtual, lang })

  for (const file of files) {
    if (!extNames.includes(file.extname) || virtual.has(file.path) || !file.imports.some((imp) => virtual.has(imp.path))) continue

    const inlined = rewriteFile({ file, definitions })
    result.files.push(inlined.file)
    result.problems.push(...inlined.problems)
  }

  return result
}

// A file of only deprecated per-source `inline` counts as inline too.
function isInlineFile(file: FileNode): boolean {
  return !!file.inline || (file.sources.length > 0 && file.sources.every((source) => source.inline))
}
