import type { ast } from '@kubb/ast'
import { isBinary, isReference } from '../oas.ts'
import { isHandledFormat } from '../resolvers.ts'
import type { Document, SchemaObject } from '../types.ts'
import { convertAllOf, convertMultiType, convertRef, convertUnion } from './converters/composition.ts'
import { convertBinary, convertBoolean, convertConst, convertEnum, convertFormat, convertNumeric, convertString, createNullNode } from './converters/scalar.ts'
import { convertArray, convertObject, convertTuple } from './converters/structural.ts'

/**
 * Pre-computed per-schema context passed to every schema converter.
 *
 * Centralizes schema derivations (type resolution, defaults, options) to avoid repeated
 * computation across all conversion branches. The `type` field is normalized from OAS 3.1
 * multi-type arrays to a single string.
 */
export type SchemaContext = {
  schema: SchemaObject
  name: string | null | undefined
  nullable: true | undefined
  defaultValue: unknown
  /**
   * Normalized single type string (first element when OAS 3.1 multi-type array).
   */
  type: string | undefined
  rawOptions: Partial<ast.ParserOptions> | undefined
  options: ast.ParserOptions
}

/**
 * Recurses into a nested schema. Converters call this instead of capturing the parser closure,
 * so each converter stays a standalone function.
 */
export type ParseFn = (entry: { schema: SchemaObject; name?: string | null }, rawOptions?: Partial<ast.ParserOptions>) => ast.SchemaNode

/**
 * What a converter needs from the parser instance beyond the schema: how to recurse, the source
 * document, and the two `$ref` helpers whose caches live on the instance.
 */
export type ConverterDeps = {
  parse: ParseFn
  document: Document
  /**
   * Resolves a `$ref` to its parsed node, with cycle detection and per-instance memoization.
   * Returns `null` for a cycle or an unresolvable target.
   */
  resolveRefNode: (refPath: string, rawOptions?: Partial<ast.ParserOptions>) => ast.SchemaNode | null
  /**
   * Returns `true` when a `$ref` path resolves to a component the document actually defines.
   */
  refExists: (refPath: string) => boolean
  /**
   * Collision renames keyed by the original component pointer, used to stamp `targetName`
   * on ref nodes whose target the adapter renamed.
   */
  renames?: ReadonlyMap<string, string>
}

/**
 * Everything a converter receives: the per-schema context plus what it needs from the parser instance.
 */
export type ConvertContext = SchemaContext & ConverterDeps

/**
 * One entry in the ordered schema rule table: a predicate paired with a converter. `match`
 * fully decides whether this rule owns the context, so `convert` always produces a node.
 */
export type SchemaRule = {
  /**
   * Returns `true` when this rule is responsible for the given context.
   */
  match: (context: ConvertContext) => boolean
  /**
   * Produces a node for the context.
   */
  convert: (context: ConvertContext) => ast.SchemaNode
}

/**
 * Ordered schema rule table. Order is significant: composition keywords (`$ref`, `allOf`,
 * `oneOf`/`anyOf`) take precedence over `const`/`format`, which take precedence over the plain
 * `type`. The first matching rule that produces a node wins. See {@link SchemaRule} for the
 * match/convert/fall-through contract.
 */
export const schemaRules: Array<SchemaRule> = [
  { match: ({ schema }) => isReference(schema), convert: convertRef },
  { match: ({ schema }) => !!schema.allOf?.length, convert: convertAllOf },
  { match: ({ schema }) => !!(schema.oneOf?.length || schema.anyOf?.length), convert: convertUnion },
  { match: ({ schema }) => 'const' in schema && schema.const !== undefined, convert: convertConst },
  {
    match: ({ schema, options }) => {
      if (!schema.format) return false
      if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') return options.dateType !== false
      return isHandledFormat(schema.format)
    },
    convert: convertFormat,
  },
  { match: ({ schema }) => isBinary(schema), convert: convertBinary },
  { match: ({ schema }) => Array.isArray(schema.type) && schema.type.filter((t) => t !== 'null').length > 1, convert: convertMultiType },
  {
    match: ({ schema, type }) => !type && (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined),
    convert: convertString,
  },
  {
    match: ({ schema, type }) => !type && (schema.minimum !== undefined || schema.maximum !== undefined),
    convert: (ctx) => convertNumeric(ctx, 'number'),
  },
  { match: ({ schema }) => !!schema.enum?.length, convert: convertEnum },
  {
    match: ({ schema, type }) => type === 'object' || !!schema.properties || !!schema.additionalProperties || 'patternProperties' in schema,
    convert: convertObject,
  },
  { match: ({ schema }) => 'prefixItems' in schema, convert: convertTuple },
  { match: ({ schema, type }) => type === 'array' || 'items' in schema, convert: convertArray },
  { match: ({ type }) => type === 'string', convert: convertString },
  { match: ({ type }) => type === 'number', convert: (ctx) => convertNumeric(ctx, 'number') },
  { match: ({ type }) => type === 'integer', convert: (ctx) => convertNumeric(ctx, 'integer') },
  { match: ({ type }) => type === 'boolean', convert: convertBoolean },
  { match: ({ type }) => type === 'null', convert: ({ schema, name, nullable }) => createNullNode(schema, name, nullable) },
]
