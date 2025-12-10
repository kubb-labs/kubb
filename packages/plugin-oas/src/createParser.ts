import { SchemaGenerator } from './SchemaGenerator.ts'
import type { Schema, SchemaKeywordMapper, SchemaMapper, SchemaTree } from './SchemaMapper.ts'
import { schemaKeywords } from './SchemaMapper.ts'

/**
 * Handler context with parse method available via `this`
 */
export type HandlerContext<TOutput, TOptions> = {
  parse: (tree: SchemaTree, options: TOptions) => TOutput | null | undefined
}

/**
 * Handler function type for custom keyword processing
 * Handlers can access the parse function via `this.parse`
 */
export type KeywordHandler<TOutput, TOptions> = (this: HandlerContext<TOutput, TOptions>, tree: SchemaTree, options: TOptions) => TOutput | null | undefined

/**
 * Configuration for createParser
 */
export type CreateParserConfig<TOutput, TOptions> = {
  /**
   * The keyword mapper that maps schema keywords to output generators
   */
  mapper: SchemaMapper<TOutput>

  /**
   * Custom handlers for specific schema keywords
   * These provide the implementation for complex types that need special processing
   *
   * Use function syntax (not arrow functions) to enable use of `this` keyword:
   * ```typescript
   * handlers: {
   *   enum(tree, options, parse) {
   *     // Implementation
   *   }
   * }
   * ```
   *
   * Common keywords that typically need handlers:
   * - union: Combine multiple schemas into a union
   * - and: Combine multiple schemas into an intersection
   * - array: Handle array types with items
   * - object: Handle object types with properties
   * - enum: Handle enum types
   * - tuple: Handle tuple types
   * - const: Handle literal/const types
   * - ref: Handle references to other schemas
   * - string/number/integer: Handle primitives with constraints (min/max)
   * - matches: Handle regex patterns
   * - default/describe/optional/nullable: Handle modifiers
   */
  handlers: Partial<{
    [K in keyof SchemaKeywordMapper]: KeywordHandler<TOutput, TOptions>
  }>
}

/**
 * Creates a parser function that converts schema trees to output using the provided mapper and handlers
 *
 * This function provides a framework for building parsers by:
 * 1. Checking for custom handlers for each keyword
 * 2. Falling back to the mapper for simple keywords
 * 3. Providing utilities for common operations (finding siblings, etc.)
 *
 * The generated parser is recursive and can handle nested schemas.
 *
 * @template TOutput - The output type (e.g., string for Zod/Faker, ts.TypeNode for TypeScript)
 * @template TOptions - The parser options type
 * @param config - Configuration object containing mapper and handlers
 * @returns A parse function that converts SchemaTree to TOutput
 *
 * @example
 * ```ts
 * // Create a simple string-based parser
 * const parse = createParser({
 *   mapper: zodKeywordMapper,
 *   handlers: {
 *     union(tree, options) {
 *       const items = tree.current.args
 *         .map(it => this.parse({ ...tree, current: it }, options))
 *         .filter(Boolean)
 *       return `z.union([${items.join(', ')}])`
 *     },
 *     string(tree, options) {
 *       const minSchema = findSchemaKeyword(tree.siblings, 'min')
 *       const maxSchema = findSchemaKeyword(tree.siblings, 'max')
 *       return zodKeywordMapper.string(false, minSchema?.args, maxSchema?.args)
 *     }
 *   }
 * })
 * ```
 */
export function createParser<TOutput, TOptions extends Record<string, any>>(
  config: CreateParserConfig<TOutput, TOptions>,
): (tree: SchemaTree, options: TOptions) => TOutput | null | undefined {
  const { mapper, handlers } = config

  function parse(tree: SchemaTree, options: TOptions): TOutput | null | undefined {
    const { current } = tree

    // Check if there's a custom handler for this keyword
    const handler = handlers[current.keyword as keyof SchemaKeywordMapper]
    if (handler) {
      // Create context object with parse method accessible via `this`
      const context: HandlerContext<TOutput, TOptions> = { parse }
      return handler.call(context, tree, options)
    }

    // Fall back to simple mapper lookup
    const value = mapper[current.keyword as keyof typeof mapper]

    if (!value) {
      return undefined
    }

    // For simple keywords without args, call the mapper directly
    if (current.keyword in mapper) {
      return value()
    }

    return undefined
  }

  return parse
}

/**
 * Helper to find a schema keyword in siblings
 * Useful in handlers when you need to find related schemas (e.g., min/max for string)
 *
 * @example
 * ```ts
 * const minSchema = findSchemaKeyword(tree.siblings, 'min')
 * const maxSchema = findSchemaKeyword(tree.siblings, 'max')
 * return zodKeywordMapper.string(false, minSchema?.args, maxSchema?.args)
 * ```
 */
export function findSchemaKeyword<K extends keyof SchemaKeywordMapper>(siblings: Schema[], keyword: K): SchemaKeywordMapper[K] | undefined {
  return SchemaGenerator.find(siblings, schemaKeywords[keyword]) as SchemaKeywordMapper[K] | undefined
}
