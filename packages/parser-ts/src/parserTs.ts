import type { FileNode, SourceNode } from '@kubb/ast'
import { defineParser } from '@kubb/core'
import type * as ts from 'typescript'
import { getRelativePath, print, printExport, printImport, printSource, resolveOutputPath } from './utils.ts'

/**
 * Default Kubb parser for `.ts` and `.js` files. Takes the universal AST
 * produced by an adapter and prints it as TypeScript source using the official
 * TypeScript compiler. Imports and exports are rewritten based on each file's
 * metadata.
 *
 * Used automatically when no `parsers` option is set on `defineConfig`. Use
 * `parserTsx` instead for React projects that emit JSX.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { parserTs } from '@kubb/parser-ts'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   parsers: [parserTs],
 *   plugins: [],
 * })
 * ```
 */
export const parserTs = defineParser({
  name: 'typescript',
  extNames: ['.ts', '.js'],
  print(...nodes: Array<ts.Node>) {
    return print(...nodes)
  },
  parse(file, options = { extname: '.ts' }) {
    const sourceParts: Array<string> = []
    for (const item of file.sources) {
      const sourceStr = printSource(item as SourceNode)
      if (sourceStr) {
        sourceParts.push(sourceStr.trimEnd())
      }
    }
    const source = sourceParts.join('\n\n')

    const importLines: Array<string> = []
    for (const item of (file as FileNode).imports) {
      const importPath = item.root ? getRelativePath(item.root, item.path) : item.path
      importLines.push(
        printImport({
          name: item.name as string | Array<string | { propertyName: string; name?: string }>,
          path: resolveOutputPath(importPath, options, Boolean(item.root)),
          isTypeOnly: item.isTypeOnly,
          isNameSpace: item.isNameSpace,
        }),
      )
    }

    const exportLines: Array<string> = []
    for (const item of (file as FileNode).exports) {
      exportLines.push(
        printExport({
          name: item.name as string | Array<ts.Identifier | string> | null | undefined,
          path: resolveOutputPath(item.path, options, true),
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        }),
      )
    }

    const importExportBlock = [...importLines, ...exportLines].join('\n')

    const parts = [file.banner, importExportBlock, source, file.footer].filter((segment): segment is string => Boolean(segment)).map((s) => s.trimEnd())
    return parts.join('\n\n')
  },
})
