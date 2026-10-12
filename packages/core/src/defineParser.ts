import type { FileNode, UserFileNode } from '@kubb/ast'
import { defineExtension } from './defineExtension.ts'
import type { ExtensionFactory, ExtensionMeta } from './defineExtension.ts'

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
   * Identity and compatibility data. Set by the object form of `defineParser`.
   */
  meta?: ExtensionMeta
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
   * Turn the content of a `copy` file into a file node that `parse` prints. Omit to copy the file verbatim.
   */
  copy?(file: FileNode<TMeta>, source: string): UserFileNode<TMeta>
  /**
   * Render compiler AST nodes for this parser's language into source text.
   * Plugins call this to format the nodes they assemble before handing them
   * back to the parser as `FileNode.sources`.
   */
  print(...nodes: Array<TNode>): string
}

/**
 * The object passed to `defineParser`. `setup` receives the user's options and returns the parser methods.
 */
export type ParserDefinition<TOptions extends object = object, TMeta extends object = object, TNode = unknown> = {
  meta: ExtensionMeta
  setup(options: TOptions): Omit<Parser<TMeta, TNode>, 'name' | 'meta'>
}

/**
 * The function `defineParser` returns. Call it with user options to get a `Parser`.
 */
export type ParserFactory<TOptions extends object = object, TMeta extends object = object, TNode = unknown> = ExtensionFactory<
  'parser',
  TOptions,
  Parser<TMeta, TNode>
>

/**
 * Defines a parser from one object and returns a factory that takes the user's options.
 * Register the result in the `parsers` array on `defineConfig`.
 *
 * @example
 * ```ts
 * export const parserJson = defineParser<{ pretty?: boolean }>({
 *   meta: { name: 'json', compatibility: { kubb: '>=5.7.0' } },
 *   setup(options) {
 *     return {
 *       extNames: ['.json'],
 *       parse(file) {
 *         const source = file.sources.map((source) => extractStringsFromNodes(source.nodes ?? [])).join('\n')
 *         return options.pretty ? JSON.stringify(JSON.parse(source), null, 2) : source
 *       },
 *       print: (...nodes) => nodes.map(String).join('\n'),
 *     }
 *   },
 * })
 * ```
 */
export function defineParser<TOptions extends object = object, TMeta extends object = object, TNode = unknown>(
  definition: ParserDefinition<TOptions, TMeta, TNode>,
): ParserFactory<TOptions, TMeta, TNode>
/**
 * Wraps a factory function that returns a `Parser`, and calls it with the user's options.
 *
 * @deprecated Pass a definition object with `meta` and `setup` instead. The factory form is removed in the next major.
 */
export function defineParser<TOptions extends object = object, TMeta extends object = object, TNode = unknown>(
  factory: (options: TOptions) => Parser<TMeta, TNode>,
): (options?: TOptions) => Parser<TMeta, TNode>
/**
 * Handles both forms: a function is the deprecated factory, an object is a definition.
 */
export function defineParser(input: ParserDefinition | ((options: object) => Parser)): ParserFactory | ((options?: object) => Parser) {
  if (typeof input === 'function') {
    return (options) => input(options ?? {})
  }

  const { meta, setup } = input
  return defineExtension({ kind: 'parser', meta, build: (options: object): Parser => ({ ...setup(options), name: meta.name, meta }) })
}
