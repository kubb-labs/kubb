import type {
  ArraySchemaNode,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
  IntersectionSchemaNode,
  NumberSchemaNode,
  ObjectSchemaNode,
  RefSchemaNode,
  ScalarSchemaNode,
  SchemaNode,
  SchemaType,
  StringSchemaNode,
  TimeSchemaNode,
  UnionSchemaNode,
} from '@internals/ast'
import { SchemaGenerator } from './SchemaGenerator.ts'
import type { Schema, SchemaKeywordMapper, SchemaMapper, SchemaTree } from './SchemaMapper.ts'
import { schemaKeywords } from './SchemaMapper.ts'

/**
 * @deprecated use createParserSchemaNode
 */
type SchemaTreeWithKeyword<K extends keyof SchemaKeywordMapper> = Omit<SchemaTree, 'current'> & {
  current: SchemaKeywordMapper[K]
}

/**
 * @deprecated use createParserSchemaNode
 */
export type HandlerContext<TOutput, TOptions> = {
  parse: (tree: SchemaTree, options: TOptions) => TOutput | null | undefined
}

/**
 * @deprecated use createParserSchemaNode
 */
export type KeywordHandler<TOutput, TOptions, K extends keyof SchemaKeywordMapper = keyof SchemaKeywordMapper> = (
  this: HandlerContext<TOutput, TOptions>,
  tree: SchemaTreeWithKeyword<K>,
  options: TOptions,
) => TOutput | null | undefined

/**
 * @deprecated use createParserSchemaNode
 */
export type CreateParserConfig<TOutput, TOptions> = {
  mapper: SchemaMapper<TOutput>
  handlers: Partial<{
    [K in keyof SchemaKeywordMapper]: KeywordHandler<TOutput, TOptions, K>
  }>
}

/**
 * @deprecated use createParserSchemaNode
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
      // We need to cast tree here because TypeScript can't statically verify
      // that the handler type matches the current keyword at runtime
      return handler.call(context, tree as any, options)
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
 * @deprecated use createParserSchemaNode
 */
export function findSchemaKeyword<K extends keyof SchemaKeywordMapper>(siblings: Schema[], keyword: K): SchemaKeywordMapper[K] | undefined {
  return SchemaGenerator.find(siblings, schemaKeywords[keyword]) as SchemaKeywordMapper[K] | undefined
}

/**
 * Maps each `SchemaType` to the concrete `SchemaNode` variant it discriminates to.
 * Used to infer handler argument types in `createParserSchemaNode`.
 */
type SchemaNodeByType = {
  object: ObjectSchemaNode
  array: ArraySchemaNode
  tuple: ArraySchemaNode
  union: UnionSchemaNode
  intersection: IntersectionSchemaNode
  enum: EnumSchemaNode
  ref: RefSchemaNode
  datetime: DatetimeSchemaNode
  date: DateSchemaNode
  time: TimeSchemaNode
  string: StringSchemaNode
  number: NumberSchemaNode
  integer: NumberSchemaNode
  bigint: NumberSchemaNode
  boolean: ScalarSchemaNode
  null: ScalarSchemaNode
  any: ScalarSchemaNode
  unknown: ScalarSchemaNode
  void: ScalarSchemaNode
  uuid: ScalarSchemaNode
  email: ScalarSchemaNode
  url: ScalarSchemaNode
  blob: ScalarSchemaNode
}

/**
 * Handler context for `createParserSchemaNode` — exposes a recursive `parse` via `this`.
 */
export type SchemaNodeHandlerContext<TOutput, TOptions> = {
  parse: (node: SchemaNode, options: TOptions) => TOutput | null | undefined
}

/**
 * Handler for a specific `SchemaNode` variant identified by `SchemaType` key `T`.
 */
export type SchemaNodeHandler<TOutput, TOptions, T extends SchemaType = SchemaType> = (
  this: SchemaNodeHandlerContext<TOutput, TOptions>,
  node: SchemaNodeByType[T],
  options: TOptions,
) => TOutput | null | undefined

/**
 * Configuration for `createParserSchemaNode`.
 */
export type CreateParserSchemaNodeConfig<TOutput, TOptions> = {
  /**
   * Fallback mapper keyed by `SchemaType`. Each entry is a zero-argument factory
   * used when no `handler` is registered for that type. Return `undefined` to skip.
   */
  mapper?: Partial<Record<SchemaType, () => TOutput | undefined>>

  /**
   * Custom handlers for specific `SchemaNode` variants.
   * Use regular function syntax (not arrow functions) so that `this.parse` is available
   * for recursive calls.
   *
   * @example
   * ```ts
   * handlers: {
   *   string(node, options) {
   *     return `z.string()${node.min !== undefined ? `.min(${node.min})` : ''}`
   *   },
   *   object(node, options) {
   *     const props = node.properties?.map(p => `${p.name}: ${this.parse(p.schema, options)}`).join(', ')
   *     return `z.object({ ${props} })`
   *   },
   * }
   * ```
   */
  handlers: Partial<{
    [T in SchemaType]: SchemaNodeHandler<TOutput, TOptions, T>
  }>
}

/**
 * Creates a parser function that converts `SchemaNode` AST nodes to output using the
 * provided mapper and handlers. This is the `SchemaNode`-native counterpart to
 * `createParser`, which operates on the legacy `Schema[]` / keyword tree.
 *
 * Dispatch is based on `node.type` (the `SchemaNode` discriminant) rather than
 * `current.keyword`.
 *
 * @example
 * ```ts
 * const parse = createParserSchemaNode<string, {}>({
 *   handlers: {
 *     string(node) {
 *       return `z.string()${node.min !== undefined ? `.min(${node.min})` : ''}`
 *     },
 *     object(node, options) {
 *       const props = node.properties
 *         ?.map(p => `${p.name}: ${this.parse(p.schema, options)}`)
 *         .join(', ') ?? ''
 *       return `z.object({ ${props} })`
 *     },
 *     union(node, options) {
 *       const members = node.members?.map(m => this.parse(m, options)).filter(Boolean) ?? []
 *       return `z.union([${members.join(', ')}])`
 *     },
 *   },
 * })
 * ```
 */
export function createParserSchemaNode<TOutput, TOptions extends Record<string, unknown>>(
  config: CreateParserSchemaNodeConfig<TOutput, TOptions>,
): (node: SchemaNode, options: TOptions) => TOutput | null | undefined {
  const { mapper, handlers } = config

  function parse(node: SchemaNode, options: TOptions): TOutput | null | undefined {
    const type = node.type as SchemaType

    const handler = handlers[type]
    if (handler) {
      const context: SchemaNodeHandlerContext<TOutput, TOptions> = { parse }
      return (handler as SchemaNodeHandler<TOutput, TOptions>).call(context, node as SchemaNodeByType[SchemaType], options)
    }

    const fallback = mapper?.[type]
    if (fallback) {
      return fallback()
    }

    return undefined
  }

  return parse
}
