import type { FileNode, SourceNode } from '@kubb/ast'
import type { Parser } from '@kubb/core'
import { defineParser } from '@kubb/core'
import { emitExport, emitImport, getRelativePath, printSource, resolveOutputPath } from './utils.ts'

export { createExport, createImport, print, safePrint, validateNodes } from './utils.ts'

export { printArrowFunction, printCodeNode, printConst, printFunction, printJSDoc, printSource, printType } from './utils.ts'

/**
 * Parser that converts `.ts` and `.js` files to strings.
 *
 * Imports and exports are emitted directly as strings (matching the TypeScript printer's
 * `omitTrailingSemicolon: true` output) to avoid invoking the TypeScript compiler API on
 * every file. Source nodes still flow through {@link printSource}.
 *
 * @default Used automatically when no `parsers` option is set in `defineConfig`.
 */
export const parserTs: Parser = defineParser({
  name: 'typescript',
  extNames: ['.ts', '.js'],
  async parse(file, options = { extname: '.ts' }) {
    const sourceParts: Array<string> = []
    for (const item of file.sources) {
      const sourceStr = printSource(item as SourceNode)
      if (sourceStr) {
        sourceParts.push(sourceStr.trimEnd())
      }
    }
    const source = sourceParts.join('\n\n')

    const declarationParts: string[] = []
    for (const item of (file as FileNode).imports) {
      const importPath = item.root ? getRelativePath(item.root, item.path) : item.path
      declarationParts.push(
        emitImport({
          name: item.name as string | Array<string | { propertyName: string; name?: string }>,
          path: resolveOutputPath(importPath, options, Boolean(item.root)),
          isTypeOnly: item.isTypeOnly,
          isNameSpace: item.isNameSpace,
        }),
      )
    }
    for (const item of (file as FileNode).exports) {
      declarationParts.push(
        emitExport({
          name: item.name,
          path: resolveOutputPath(item.path, options, true),
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        }),
      )
    }
    const declarations = declarationParts.join('\n')

    const parts: string[] = []
    if (file.banner) parts.push(file.banner.trimEnd())
    if (declarations) parts.push(declarations.trimEnd())
    if (source) parts.push(source.trimEnd())
    if (file.footer) parts.push(file.footer.trimEnd())
    return parts.join('\n\n')
  },
})
