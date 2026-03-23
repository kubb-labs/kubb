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
} from '@kubb/ast/types'
import type { SchemaObject } from './oas/types.ts'
import type { ParserOptions } from './types.ts'

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
 * Single source of truth: ordered list of `[shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the node type of the first matching entry.
 * Parameterized over `TDateType` so `format: 'date-time'` resolves to the correct node based on the option.
 */
type SchemaNodeMap<TDateType extends ParserOptions['dateType'] = 'string'> = [
  [{ $ref: string }, RefSchemaNode],
  [{ allOf: ReadonlyArray<unknown>; properties: object }, IntersectionSchemaNode],
  [{ allOf: readonly [unknown, unknown, ...unknown[]] }, IntersectionSchemaNode],
  [{ allOf: ReadonlyArray<unknown> }, SchemaNode],
  [{ oneOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ anyOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ const: null }, ScalarSchemaNode],
  [{ const: string | number | boolean }, EnumSchemaNode],
  [{ type: ReadonlyArray<string> }, UnionSchemaNode],
  [{ type: 'array'; enum: ReadonlyArray<unknown> }, ArraySchemaNode],
  [{ enum: ReadonlyArray<unknown> }, EnumSchemaNode],
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

export type InferSchemaNode<
  TSchema extends SchemaObject,
  TDateType extends ParserOptions['dateType'] = 'string',
  TEntries extends ReadonlyArray<[object, SchemaNode]> = SchemaNodeMap<TDateType>,
> = TEntries extends [infer TEntry extends [object, SchemaNode], ...infer TRest extends ReadonlyArray<[object, SchemaNode]>]
  ? TSchema extends TEntry[0]
    ? TEntry[1]
    : InferSchemaNode<TSchema, TDateType, TRest>
  : SchemaNode
