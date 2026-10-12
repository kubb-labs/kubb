import type { FileNode, UserFileNode } from '@kubb/ast'
import { defineExtension, resolveMeta } from './defineExtension.ts'
import type { ExtensionFactory, ExtensionMeta, ExtensionNamed } from './defineExtension.ts'
import type { StandardSchemaV1 } from './standardSchema.ts'

/**
 * Converts a resolved {@link FileNode} into the final source string that gets
 * written to disk. Kubb ships with TypeScript and TSX parsers. Add your own
 * for new file types (JSON, Markdown, ...).
 */
export type Parser<TMeta extends object = object, TNode = unknown, TOptions extends object = object> = ExtensionNamed & {
  /**
   * The options passed to the parser factory, parsed by its options `schema` when it has one.
   */
  options?: TOptions
  /**
   * The options schema of the definition that built this parser.
   */
  schema?: StandardSchemaV1<unknown, TOptions>
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

type ParserBuild<TOptions extends object, TMeta extends object, TNode> = (
  options: TOptions,
) => Omit<Parser<TMeta, TNode>, 'name' | 'meta' | 'options' | 'schema'>

/**
 * The object passed to `defineParser`. `build` receives the parsed options and returns the parser methods.
 */
export type ParserDefinition<TOptions extends object = object, TMeta extends object = object, TNode = unknown, TParsedOptions extends object = TOptions> = {
  meta: ExtensionMeta
  /**
   * Any Standard Schema, such as a Zod schema, that validates the options and applies their defaults
   * when the factory is called. Invalid options throw `KUBB_INVALID_OPTIONS`. The schema must validate synchronously.
   */
  schema?: StandardSchemaV1<TOptions, TParsedOptions>
} & (
  | { build: ParserBuild<TParsedOptions, TMeta, TNode> }
  | {
      /**
       * @deprecated Renamed to `build`.
       */
      setup: ParserBuild<TParsedOptions, TMeta, TNode>
    }
)

/**
 * The function `defineParser` returns. Call it with user options to get a `Parser`.
 */
export type ParserFactory<
  TOptions extends object = object,
  TMeta extends object = object,
  TNode = unknown,
  TParsedOptions extends object = TOptions,
> = ExtensionFactory<'parser', TOptions, Parser<TMeta, TNode, TParsedOptions>, string, TParsedOptions>

/**
 * Defines a parser from one object and returns a factory that takes the user's options.
 * Register the result in the `parsers` array on `defineConfig`.
 */
export function defineParser<TOptions extends object = object, TMeta extends object = object, TNode = unknown, TParsedOptions extends object = TOptions>(
  definition: ParserDefinition<TOptions, TMeta, TNode, TParsedOptions>,
): ParserFactory<TOptions, TMeta, TNode, TParsedOptions>
/**
 * Wraps a factory function that returns a `Parser`. Without `meta`, the parser gets `{ name }`.
 *
 * @deprecated Pass a definition object with `meta` and `build` instead. The factory form is removed in the next major.
 */
export function defineParser<TOptions extends object = object, TMeta extends object = object, TNode = unknown>(
  factory: (options: TOptions) => Parser<TMeta, TNode>,
): ((options?: TOptions) => Parser<TMeta, TNode>) & { kind: 'parser' }
export function defineParser(input: ParserDefinition | ((options: object) => Parser)) {
  if (typeof input === 'function') {
    return defineExtension({
      kind: 'parser',
      build: ({ options }: { options: object }): Parser => {
        const parser = input(options)
        return { ...parser, meta: resolveMeta(parser) }
      },
    })
  }

  const { meta, schema } = input
  const build = 'build' in input ? input.build : input.setup
  return defineExtension({
    kind: 'parser',
    meta,
    schema,
    build: ({ parsedOptions }: { options: object; parsedOptions: object }): Parser => ({
      ...build(parsedOptions),
      name: meta.name,
      meta,
      options: parsedOptions,
      ...(schema && { schema }),
    }),
  })
}
