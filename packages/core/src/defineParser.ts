import type { FileNode } from '@kubb/ast'

type PrintOptions = {
  extname?: FileNode['extname']
}

/**
 * Converts a resolved {@link FileNode} into the final source string that gets
 * written to disk. Kubb ships with TypeScript and TSX parsers; add your own
 * for new file types (JSON, Markdown, ...).
 */
export type Parser<TMeta extends object = any, TNode = unknown> = {
  /**
   * Display name used in diagnostics and the parser registry.
   */
  name: string
  /**
   * File extensions this parser handles. Set to `undefined` to define a
   * catch-all fallback used when no other parser claims the extension.
   *
   * @example
   * `['.ts', '.js']`
   */
  extNames: Array<FileNode['extname']> | undefined
  /**
   * Serialise the file's AST into source code.
   */
  parse(file: FileNode<TMeta>, options?: PrintOptions): string
  /**
   * Render compiler AST nodes for this parser's language into source text.
   * Plugins call this to format the nodes they assemble before handing them
   * back to the parser as `FileNode.sources`.
   */
  print(...nodes: TNode[]): string
}

/**
 * Defines a parser with type-safe `this`. Used to register handlers for new
 * file extensions or to plug a non-TypeScript output into the build.
 *
 * @example
 * ```ts
 * import { defineParser, ast } from '@kubb/core'
 *
 * export const jsonParser = defineParser({
 *   name: 'json',
 *   extNames: ['.json'],
 *   parse(file) {
 *     return file.sources
 *       .map((source) => ast.extractStringsFromNodes(source.nodes ?? []))
 *       .join('\n')
 *   },
 *   print(...nodes) {
 *     return nodes.map(String).join('\n')
 *   },
 * })
 * ```
 */
export function defineParser<T extends Parser>(parser: T): T {
  return parser
}
