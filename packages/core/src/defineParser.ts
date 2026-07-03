import type { FileNode } from '@kubb/ast'

type PrintOptions = {
  extname?: FileNode['extname']
}

/**
 * Converts a resolved {@link FileNode} into the final source string that gets
 * written to disk. Kubb ships with TypeScript and TSX parsers. Add your own
 * for new file types (JSON, Markdown, ...).
 */
export type Parser<TMeta extends object = object, TNode = unknown> = {
  /**
   * Display name used in diagnostics and the parser registry.
   */
  name: string
  /**
   * File extensions this parser handles. The driver registers the parser for each
   * extension in this list. A parser with `undefined` here is not registered, so
   * files of an unclaimed extension fall back to joining their sources verbatim.
   *
   * @example
   * `['.ts', '.js']`
   */
  extNames: Array<FileNode['extname']> | undefined
  /**
   * Serialize the file's AST into source code.
   */
  parse(file: FileNode<TMeta>, options?: PrintOptions): string
  /**
   * Render compiler AST nodes for this parser's language into source text.
   * Plugins call this to format the nodes they assemble before handing them
   * back to the parser as `FileNode.sources`.
   */
  print(...nodes: Array<TNode>): string
}

/**
 * Defines a parser with type-safe `this`. Used to register handlers for new
 * file extensions or to plug a non-TypeScript output into the build.
 *
 * @example
 * ```ts
 * import { defineParser } from '@kubb/core'
 * import { extractStringsFromNodes } from '@kubb/ast'
 *
 * export const jsonParser = defineParser({
 *   name: 'json',
 *   extNames: ['.json'],
 *   parse(file) {
 *     return file.sources
 *       .map((source) => extractStringsFromNodes(source.nodes ?? []))
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
