import { ast } from '@kubb/ast'
import { defineExtension } from '@kubb/core'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { inlineTs } from './inline.ts'
import { getRelativePath, print, printExport, printImport, printSource, resolveOutputPath, splitModuleDeclarations, type TsNode } from './utils.ts'

const DEFAULT_EXTENSION: Record<ast.FileNode['extname'], ast.FileNode['extname'] | ''> = { '.ts': '' }

/**
 * Options accepted by `parserTs` and `parserTsx`.
 */
export type ParserTsOptions = {
  /**
   * Rewrite extensions on relative `import`/`export` statements. Each key is the extension of a
   * generated file, and its value is the extension written on the relative specifiers in that
   * file. `''` drops it, and so does a generated file whose extension has no key. Package
   * specifiers stay unchanged. Also applies to relative paths in `copy` templates.
   *
   * Use `{ '.ts': '.js' }` for ESM output compiled to JavaScript, or `{ '.ts': '.ts' }` to run the
   * `.ts` files directly in Node.js or compile them with `rewriteRelativeImportExtensions`.
   *
   * @default { '.ts': '' }
   * @example
   * ```ts
   * parserTs({ extension: { '.ts': '.js' } })         // import './api.js' instead of './api'
   * parserTs({ extension: { '.ts': '.ts' } })          // import './api.ts' instead of './api'
   * ```
   */
  extension?: Record<ast.FileNode['extname'], ast.FileNode['extname'] | ''>
}

/**
 * Default Kubb parser for `.ts` and `.js` files. Takes the universal AST
 * produced by an adapter and prints it as TypeScript source. Imports and exports
 * are rewritten based on each file's metadata and the `extension` option.
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
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   parsers: [parserTs()],
 *   plugins: [],
 * })
 * ```
 */
export const parserTs = defineExtension<ParserTsOptions, object, string | TsNode>({
  kind: 'parser',
  meta: { name: 'typescript', version, compatibility, issues: 'https://github.com/kubb-labs/kubb/issues' },
  build({ extension = DEFAULT_EXTENSION }) {
    return {
      extNames: ['.ts', '.js'],
      print,
      inline: inlineTs,
      parse(file) {
        const extname = extension[file.extname] || undefined

        const source = file.sources
          .map((item) => printSource(item))
          .filter(Boolean)
          .map((text) => text.trimEnd())
          .join('\n\n')

        const importLines = file.imports.map((item) =>
          printImport({
            ...item,
            path: resolveOutputPath(item.root ? getRelativePath(item.root, item.path) : item.path, extname, Boolean(item.root)),
          }),
        )

        const exportLines = file.exports.map((item) => printExport({ ...item, path: resolveOutputPath(item.path, extname, item.path.startsWith('.')) }))

        const importExportBlock = [...importLines, ...exportLines].join('\n')

        const parts = [file.banner, importExportBlock, source, file.footer].filter((segment): segment is string => Boolean(segment)).map((s) => s.trimEnd())

        return parts.join('\n\n')
      },
      copy(file, source) {
        const { header, imports, exports, body } = splitModuleDeclarations(source, file.path)

        return {
          ...file,
          banner: [header, file.banner].filter(Boolean).join('\n') || undefined,
          imports: [...file.imports, ...imports],
          exports: [...file.exports, ...exports],
          sources: [ast.factory.createSource({ nodes: [ast.factory.createText(body)] })],
        }
      },
    }
  },
})
