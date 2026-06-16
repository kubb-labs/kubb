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
  StringSchemaNode,
  TimeSchemaNode,
  UnionSchemaNode,
  UrlSchemaNode,
} from './nodes/index.ts'

/**
 * Options that control how the adapter parser maps OpenAPI schemas to AST nodes.
 */
export type ParserOptions = {
  /**
   * How `format: 'date-time'` schemas are represented downstream.
   * - `false` falls through to a plain `string` (no validation).
   * - `'string'` emits a datetime string node.
   * - `'stringOffset'` emits a datetime node with timezone offset.
   * - `'stringLocal'` emits a local datetime node.
   * - `'date'` emits a `date` node (JavaScript `Date` object).
   */
  dateType: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  /**
   * How `type: 'integer'` (and `format: 'int64'`) maps to TypeScript.
   * - `'bigint'` is exact for 64-bit IDs, but does not round-trip through JSON.
   * - `'number'` fits most JSON APIs. Loses precision above `Number.MAX_SAFE_INTEGER`.
   *
   * @default 'bigint'
   */
  integerType?: 'number' | 'bigint'
  /**
   * AST type used when a schema's type cannot be inferred from the spec
   * (`additionalProperties: true`, missing `type`, ...).
   */
  unknownType: 'any' | 'unknown' | 'void'
  /**
   * AST type used for completely empty schemas (`{}`).
   */
  emptySchemaType: 'any' | 'unknown' | 'void'
  /**
   * Suffix appended to derived enum names when Kubb has to invent one
   * (typically for inline enums on object properties).
   */
  enumSuffix: 'enum' | (string & {})
}

/**
 * Maps each `dateType` option value to the AST node produced by `format: 'date-time'`.
 */
type DateTimeNodeByDateType = {
  date: DateSchemaNode
  string: DatetimeSchemaNode
  stringOffset: DatetimeSchemaNode
  stringLocal: DatetimeSchemaNode
  false: StringSchemaNode
}

/**
 * Resolves the AST node produced by `format: 'date-time'` based on the `dateType` option.
 */
type ResolveDateTimeNode<TDateType extends ParserOptions['dateType']> = DateTimeNodeByDateType[TDateType extends keyof DateTimeNodeByDateType
  ? TDateType
  : 'string']

/**
 * Ordered list of `[schema-shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the first matching node type.
 */
type SchemaNodeMap<TDateType extends ParserOptions['dateType'] = 'string'> = [
  [{ $ref: string }, RefSchemaNode],
  [{ allOf: ReadonlyArray<unknown>; properties: object }, IntersectionSchemaNode],
  [{ allOf: readonly [unknown, unknown, ...Array<unknown>] }, IntersectionSchemaNode],
  [{ allOf: ReadonlyArray<unknown> }, SchemaNode],
  [{ oneOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ anyOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ const: null }, ScalarSchemaNode],
  [{ const: string | number | boolean }, EnumSchemaNode],
  [{ type: ReadonlyArray<string> }, UnionSchemaNode],
  [{ type: 'array'; enum: ReadonlyArray<unknown> }, ArraySchemaNode],
  [{ enum: ReadonlyArray<unknown> }, EnumSchemaNode],
  [{ type: 'enum' }, EnumSchemaNode],
  [{ type: 'union' }, UnionSchemaNode],
  [{ type: 'intersection' }, IntersectionSchemaNode],
  [{ type: 'tuple' }, ArraySchemaNode],
  [{ type: 'ref' }, RefSchemaNode],
  [{ type: 'datetime' }, DatetimeSchemaNode],
  [{ type: 'date' }, DateSchemaNode],
  [{ type: 'time' }, TimeSchemaNode],
  [{ type: 'url' }, UrlSchemaNode],
  [{ type: 'object' }, ObjectSchemaNode],
  [{ additionalProperties: boolean | {} }, ObjectSchemaNode],
  [{ type: 'array' }, ArraySchemaNode],
  [{ items: object }, ArraySchemaNode],
  [{ prefixItems: ReadonlyArray<unknown> }, ArraySchemaNode],
  [{ type: string; format: 'date-time' }, ResolveDateTimeNode<TDateType>],
  [{ type: string; format: 'date' }, DateSchemaNode],
  [{ type: string; format: 'time' }, TimeSchemaNode],
  [{ format: 'date-time' }, ResolveDateTimeNode<TDateType>],
  [{ format: 'date' }, DateSchemaNode],
  [{ format: 'time' }, TimeSchemaNode],
  [{ type: 'string' }, StringSchemaNode],
  [{ type: 'number' }, NumberSchemaNode],
  [{ type: 'integer' }, NumberSchemaNode],
  [{ type: 'bigint' }, NumberSchemaNode],
  [{ type: string }, ScalarSchemaNode],
  [{ minLength: number }, StringSchemaNode],
  [{ maxLength: number }, StringSchemaNode],
  [{ pattern: string }, StringSchemaNode],
  [{ minimum: number }, NumberSchemaNode],
  [{ maximum: number }, NumberSchemaNode],
]

/**
 * Infers the matching AST `SchemaNode` type from an input schema shape.
 */
export type InferSchemaNode<
  TSchema extends object,
  TDateType extends ParserOptions['dateType'] = 'string',
  TEntries extends ReadonlyArray<[object, SchemaNode]> = SchemaNodeMap<TDateType>,
> = TEntries extends [infer TEntry extends [object, SchemaNode], ...infer TRest extends ReadonlyArray<[object, SchemaNode]>]
  ? TSchema extends TEntry[0]
    ? TEntry[1]
    : InferSchemaNode<TSchema, TDateType, TRest>
  : SchemaNode
