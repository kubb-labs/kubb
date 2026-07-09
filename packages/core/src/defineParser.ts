import type { FileNode } from '@kubb/ast'

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
  parse(file: FileNode<TMeta>): string
  /**
   * Render compiler AST nodes for this parser's language into source text.
   * Plugins call this to format the nodes they assemble before handing them
   * back to the parser as `FileNode.sources`.
   */
  print(...nodes: Array<TNode>): string
}

/**
 * Wraps a parser factory and returns a function that accepts user options and
 * yields a typed {@link Parser}. Mirrors {@link definePlugin}: the factory
 * receives the caller's options, and calling the returned function without
 * options passes an empty object.
 *
 * Register the result in the `parsers` array on `defineConfig`, calling it to
 * apply options (`parserTs({ extension: { '.ts': '.js' } })`).
 *
 * @example
 * ```ts
 * import { defineParser } from '@kubb/core'
 * import { extractStringsFromNodes } from '@kubb/ast'
 *
 * export const parserJson = defineParser((options: { pretty?: boolean } = {}) => ({
 *   name: 'json',
 *   extNames: ['.json'],
 *   parse(file) {
 *     const source = file.sources.map((source) => extractStringsFromNodes(source.nodes ?? [])).join('\n')
 *     return options.pretty ? JSON.stringify(JSON.parse(source), null, 2) : source
 *   },
 *   print(...nodes) {
 *     return nodes.map(String).join('\n')
 *   },
 * }))
 * ```
 */
export function defineParser<TOptions extends object = object, TMeta extends object = object, TNode = unknown>(
  factory: (options: TOptions) => Parser<TMeta, TNode>,
): (options?: TOptions) => Parser<TMeta, TNode> {
  return (options) => factory(options ?? ({} as TOptions))
}
