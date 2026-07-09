import type { FileNode, SourceNode } from '@kubb/ast'
import { defineParser } from '@kubb/core'
import type * as ts from 'typescript'
import { getRelativePath, print, printExport, printImport, printSource, resolveOutputPath } from './utils.ts'

const DEFAULT_EXTENSION: Record<FileNode['extname'], FileNode['extname'] | ''> = { '.ts': '.ts' }

/**
 * Options accepted by `parserTs` and `parserTsx`.
 */
export type ParserTsOptions = {
  /**
   * Rewrite the extensions emitted in `import`/`export` statements, e.g. emit `.js` imports from
   * `.ts` sources for ESM dual packages. Keys are the source extension, values the output, and `''`
   * drops it. Only the module-specifier string changes, never the on-disk filename.
   *
   * @default { '.ts': '.ts' }
   * @example
   * ```ts
   * parserTs({ extension: { '.ts': '.js' } })         // import './api.js' instead of './api.ts'
   * parserTs({ extension: { '.ts': '', '.tsx': '.jsx' } })
   * ```
   */
  extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
}

/**
 * Default Kubb parser for `.ts` and `.js` files. Takes the universal AST
 * produced by an adapter and prints it as TypeScript source using the official
 * TypeScript compiler. Imports and exports are rewritten based on each file's
 * metadata and the `extension` option.
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
 *   parsers: [parserTs()],
 *   plugins: [],
 * })
 * ```
 */
export const parserTs = defineParser(({ extension = DEFAULT_EXTENSION }: ParserTsOptions = {}) => {
  return {
    name: 'typescript',
    extNames: ['.ts', '.js'],
    print(...nodes: Array<ts.Node>) {
      return print(...nodes)
    },
    parse(file) {
      const extname = extension[file.extname] || undefined

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
            path: resolveOutputPath(importPath, { extname }, Boolean(item.root)),
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
            path: resolveOutputPath(item.path, { extname }, true),
            isTypeOnly: item.isTypeOnly,
            asAlias: item.asAlias,
          }),
        )
      }

      const importExportBlock = [...importLines, ...exportLines].join('\n')

      const parts = [file.banner, importExportBlock, source, file.footer].filter((segment): segment is string => Boolean(segment)).map((s) => s.trimEnd())

      return parts.join('\n\n')
    },
  }
})
