import type { FileNode, InlineLanguage, UserFileNode } from '@kubb/ast'
import { defineExtension } from './defineExtension.ts'
import type { ExtensionFactory, ExtensionMeta, ExtensionNamed } from './defineExtension.ts'

/**
 * Converts a resolved {@link FileNode} into the final source string that gets
 * written to disk. Kubb ships with TypeScript and TSX parsers. Add your own
 * for new file types (JSON, Markdown, ...).
 */
export type Parser<TMeta extends object = object, TNode = unknown, TOptions extends object = object> = ExtensionNamed & {
  /**
   * The options passed to the parser factory.
   */
  options?: TOptions
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
  /**
   * How this parser's language finds and replaces names, so files of its extensions can absorb inline
   * sources (`SourceNode.inline`). Omit it when the language has no inline support.
   */
  inline?: InlineLanguage
}

/**
 * Takes the user's options and returns the parser methods.
 */
export type ParserBuild<TOptions extends object, TMeta extends object, TNode> = (options: TOptions) => Omit<Parser<TMeta, TNode>, 'name' | 'meta' | 'options'>

/**
 * The object passed to `defineExtension` with `kind: 'parser'`. `build` receives the user's options and returns the parser methods.
 */
export type ParserDefinition<TOptions extends object = object, TMeta extends object = object, TNode = unknown> = {
  meta: ExtensionMeta
  build: ParserBuild<TOptions, TMeta, TNode>
}

/**
 * The function `defineExtension` returns for a parser. Call it with user options to get a `Parser`.
 */
export type ParserFactory<TOptions extends object = object, TMeta extends object = object, TNode = unknown> = ExtensionFactory<
  'parser',
  TOptions,
  Parser<TMeta, TNode, TOptions>
>

/**
 * Defines a parser from one object and returns a factory that takes the user's options.
 * Register the result in the `parsers` array on `defineConfig`.
 *
 * @deprecated Use `defineExtension` with `kind: 'parser'` instead.
 */
export function defineParser<TOptions extends object = object, TMeta extends object = object, TNode = unknown>(
  definition: ParserDefinition<TOptions, TMeta, TNode>,
): ParserFactory<TOptions, TMeta, TNode> {
  return defineExtension({ kind: 'parser', ...definition })
}
