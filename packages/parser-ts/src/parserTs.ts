import type { FileNode, SourceNode } from '@kubb/ast'
import type { Parser } from '@kubb/core'
import { defineParser } from '@kubb/core'
import type * as ts from 'typescript'
import { createExport, createImport, getRelativePath, print, printSource, resolveOutputPath } from './utils.ts'

export { createExport, createImport, print, safePrint, validateNodes } from './utils.ts'

export { printArrowFunction, printCodeNode, printConst, printFunction, printJSDoc, printSource, printType } from './utils.ts'

/**
 * Parser that converts `.ts` and `.js` files to strings using the TypeScript
 * compiler. Handles import/export statement generation from file metadata.
 *
 * @default Used automatically when no `parsers` option is set in `defineConfig`.
 */
export const parserTs: Parser = defineParser({
  name: 'typescript',
  extNames: ['.ts', '.js'],
  parse(file, options = { extname: '.ts' }) {
    const sourceParts: Array<string> = []
    for (const item of file.sources) {
      const sourceStr = printSource(item as SourceNode)
      if (sourceStr) {
        sourceParts.push(sourceStr.trimEnd())
      }
    }
    const source = sourceParts.join('\n\n')

    const importNodes: Array<ts.ImportDeclaration> = []
    for (const item of (file as FileNode).imports) {
      const importPath = item.root ? getRelativePath(item.root, item.path) : item.path
      importNodes.push(
        createImport({
          name: item.name as string | Array<string | { propertyName: string; name?: string }>,
          path: resolveOutputPath(importPath, options, Boolean(item.root)),
          isTypeOnly: item.isTypeOnly,
          isNameSpace: item.isNameSpace,
        }),
      )
    }

    const exportNodes: Array<ts.ExportDeclaration> = []
    for (const item of (file as FileNode).exports) {
      exportNodes.push(
        createExport({
          name: item.name as string | Array<ts.Identifier | string> | undefined,
          path: resolveOutputPath(item.path, options, true),
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        }),
      )
    }

    const parts = [file.banner, print(...importNodes, ...exportNodes), source, file.footer]
      .filter((segment): segment is string => Boolean(segment))
      .map((s) => s.trimEnd())
    return parts.join('\n\n')
  },
})
