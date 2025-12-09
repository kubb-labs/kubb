import { isKeyword, type Schema, type SchemaKeywordMapper, type SchemaMapper, type SchemaTree, schemaKeywords } from '../SchemaMapper.ts'
import type { BaseParserOptions } from './ParserHelpers.ts'

/**
 * Configuration for creating a parser with keyword mapper and parse logic.
 *
 * @template TOutput - The output type of the parser (typically string for code generation, or AST nodes)
 * @template TOptions - Parser-specific options that extend BaseParserOptions
 */
export type CreateParserConfig<TOutput, TOptions extends BaseParserOptions> = {
  /**
   * The keyword mapper that maps OpenAPI schema keywords to output code/nodes.
   * Must implement SchemaMapper interface with all required schema keywords.
   */
  keywordMapper: SchemaMapper<TOutput>

  /**
   * Optional pre-processing function called before parsing each schema node.
   * Can be used for validation, normalization, or custom logic.
   *
   * @param context - The current schema tree context
   * @param options - Parser options
   * @returns Modified context or undefined to skip processing
   */
  beforeParse?: (context: SchemaTree, options: TOptions) => SchemaTree | undefined

  /**
   * Optional post-processing function called after parsing each schema node.
   * Can be used to transform or enhance the output.
   *
   * @param output - The parsed output
   * @param context - The original schema tree context
   * @param options - Parser options
   * @returns Modified output
   */
  afterParse?: (output: TOutput | null | undefined, context: SchemaTree, options: TOptions) => TOutput | null | undefined

  /**
   * Custom handlers for specific schema keywords.
   * These override the default recursive parsing logic for complex types.
   *
   * @example
   * ```ts
   * customHandlers: {
   *   union: (context, options, parse) => {
   *     // Custom union handling
   *     return myCustomUnionLogic(context, options)
   *   }
   * }
   * ```
   */
  customHandlers?: Partial<{
    [K in keyof SchemaKeywordMapper]: (
      context: SchemaTree,
      options: TOptions,
      parse: (context: SchemaTree, options: TOptions) => TOutput | null | undefined,
    ) => TOutput | null | undefined
  }>
}

/**
 * Creates a parser function that converts OpenAPI schemas to validation library syntax.
 *
 * This factory function provides a consistent way to create parsers for different
 * validation libraries (Zod, Valibot, ArkType, etc.) by handling the common
 * recursive parsing logic while allowing customization through keyword mappers
 * and handlers.
 *
 * @template TOutput - The output type (string for code generation, AST nodes for TypeScript, etc.)
 * @template TOptions - Parser-specific options that extend BaseParserOptions
 *
 * @param config - Configuration object with keyword mapper and optional hooks
 * @returns A parse function that processes schema trees
 *
 * @example
 * ```typescript
 * import { createParser } from '@kubb/plugin-oas/parsers'
 *
 * // Create a Valibot parser
 * const valibotKeywordMapper = {
 *   string: () => 'v.string()',
 *   number: () => 'v.number()',
 *   // ... other keywords
 * }
 *
 * export const parse = createParser({
 *   keywordMapper: valibotKeywordMapper,
 *   customHandlers: {
 *     union: (context, options, parse) => {
 *       const items = context.current.args
 *         .map(it => parse({ ...context, current: it }, options))
 *         .filter(Boolean)
 *       return `v.union([${items.join(', ')}])`
 *     }
 *   }
 * })
 * ```
 */
export function createParser<TOutput, TOptions extends BaseParserOptions>(
  config: CreateParserConfig<TOutput, TOptions>,
): (context: SchemaTree, options: TOptions) => TOutput | null | undefined {
  const { keywordMapper, beforeParse, afterParse, customHandlers } = config

  function parse(context: SchemaTree, options: TOptions): TOutput | null | undefined {
    // Allow pre-processing
    if (beforeParse) {
      const modifiedContext = beforeParse(context, options)
      if (!modifiedContext) {
        return undefined
      }
      context = modifiedContext
    }

    const { schema, current, siblings, name } = context

    // Check for custom handler first
    const customHandler = customHandlers?.[current.keyword as keyof SchemaKeywordMapper]
    if (customHandler) {
      const result = customHandler(context, options, parse)
      return afterParse ? afterParse(result, context, options) : result
    }

    // Get the keyword mapper function
    const mapperFn = keywordMapper[current.keyword as keyof typeof keywordMapper]

    if (!mapperFn) {
      return undefined
    }

    // Handle common complex types with default recursive logic
    // These can be overridden by customHandlers if needed

    if (isKeyword(current, schemaKeywords.union)) {
      const items = (current.args as Schema[])
        .map((it) => parse({ schema, parent: current, name, current: it, siblings }, options))
        .filter((v): v is TOutput => v !== null && v !== undefined)

      const result = (mapperFn as any)(items)
      return afterParse ? afterParse(result, context, options) : result
    }

    if (isKeyword(current, schemaKeywords.and)) {
      const items = (current.args as Schema[])
        .map((it) => parse({ schema, parent: current, name, current: it, siblings }, options))
        .filter((v): v is TOutput => v !== null && v !== undefined)

      const result = (mapperFn as any)(items)
      return afterParse ? afterParse(result, context, options) : result
    }

    if (isKeyword(current, schemaKeywords.array)) {
      const items = current.args.items
        .map((it: Schema) => parse({ schema, parent: current, name, current: it, siblings }, options))
        .filter((v): v is TOutput => v !== null && v !== undefined)

      const result = (mapperFn as any)(items, current.args.min, current.args.max, current.args.unique)
      return afterParse ? afterParse(result, context, options) : result
    }

    if (isKeyword(current, schemaKeywords.tuple)) {
      const items = current.args.items
        .map((it: Schema) => parse({ schema, parent: current, name, current: it, siblings }, options))
        .filter((v): v is TOutput => v !== null && v !== undefined)

      const rest = current.args.rest ? parse({ schema, parent: current, name, current: current.args.rest, siblings }, options) : undefined

      const result = (mapperFn as any)(items, rest, current.args.min, current.args.max)
      return afterParse ? afterParse(result, context, options) : result
    }

    if (isKeyword(current, schemaKeywords.object)) {
      // Object parsing is complex and typically needs custom handling
      // The mapper function should handle the full object structure
      const result = (mapperFn as any)(context, options, parse)
      return afterParse ? afterParse(result, context, options) : result
    }

    // For simple keywords, just call the mapper function
    // The mapper function signature varies, so we call it with the schema's args if available
    if ('args' in current && current.args !== undefined) {
      const result = (mapperFn as any)(current.args)
      return afterParse ? afterParse(result, context, options) : result
    }

    const result = (mapperFn as any)()
    return afterParse ? afterParse(result, context, options) : result
  }

  return parse
}
