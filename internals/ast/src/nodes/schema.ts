/**
 * Spec-agnostic schema type system.
 *
 * These types map directly to the kinds of values that can appear in any API
 * schema language (OpenAPI, JSON Schema, Protobuf, …) without being coupled
 * to any of them.
 */

/** Primitive scalar types. */
export type PrimitiveSchemaType = 'string' | 'number' | 'integer' | 'bigint' | 'boolean' | 'null' | 'any' | 'unknown' | 'void'

/** Structural / composite types. */
export type ComplexSchemaType = 'object' | 'array' | 'tuple' | 'union' | 'intersection' | 'enum'

/**
 * Well-known semantic types that most code-generators want to handle
 * specially (e.g. generate a `Date` object or a branded type).
 */
export type SpecialSchemaType = 'ref' | 'date' | 'datetime' | 'time' | 'uuid' | 'email' | 'url' | 'blob'

/** All possible schema types. */
export type SchemaType = PrimitiveSchemaType | ComplexSchemaType | SpecialSchemaType

export type ScalarSchemaType = ScalarSchemaNode['type']

/** Runtime constants for all schema type values. */
export const schemaTypes = {
  // Primitive scalar types
  string: 'string',
  /** Floating-point number (`float`, `double`). Maps to `number` in TypeScript and most languages. */
  number: 'number',
  /** Whole number (`int32`). Maps to `number` in TypeScript. Use `bigint` for `int64` when precision matters. */
  integer: 'integer',
  /** 64-bit integer (`int64`). Maps to `bigint` in TypeScript. Only used when the `integerType` option is set to `'bigint'`. */
  bigint: 'bigint',
  boolean: 'boolean',
  null: 'null',
  any: 'any',
  unknown: 'unknown',
  void: 'void',
  // Structural / composite types
  object: 'object',
  array: 'array',
  tuple: 'tuple',
  union: 'union',
  intersection: 'intersection',
  enum: 'enum',
  // Well-known semantic types
  ref: 'ref',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  uuid: 'uuid',
  email: 'email',
  url: 'url',
  blob: 'blob',
} as const satisfies Record<SchemaType, SchemaType>

import type { BaseNode } from './base.ts'
import type { PropertyNode } from './property.ts'

/**
 * Fields shared by every schema variant.
 *
 * `SchemaNode` intentionally does **not** carry any OpenAPI / JSON Schema
 * specific fields. Parsers (e.g. `plugin-oas`) are responsible for
 * converting specification-specific constructs into this normalized form.
 */
interface SchemaNodeBase extends BaseNode {
  kind: 'Schema'
  /**
   * The canonical name of this schema when it is a named/reusable definition
   * (e.g. `"Pet"` from `#/components/schemas/Pet`). May be `undefined` for
   * inline anonymous schemas.
   */
  name?: string
  /** Human-readable title, taken from the source spec. */
  title?: string
  /** Human-readable description, taken from the source spec. */
  description?: string
  /** Whether the schema explicitly marks values as nullable (can be `null`). */
  nullable?: boolean
  /**
   * Whether this schema is optional in its context (property is absent from
   * the parent object's `required` array and the value is NOT nullable).
   */
  optional?: boolean
  /**
   * Whether this schema is both optional and nullable — i.e. the property is
   * absent from `required` **and** the value may be `null`
   * (`optional + nullable` combined).
   */
  nullish?: boolean
  /** Whether the schema is marked as deprecated. */
  deprecated?: boolean
  /** Whether the schema is read-only. */
  readOnly?: boolean
  /** Whether the schema is write-only. */
  writeOnly?: boolean
  /** A concrete default value for this schema. */
  default?: unknown
  /** An example value for this schema. */
  example?: unknown
}

/** Schema for `'object'` type — carries ordered property definitions. */
export interface ObjectSchemaNode extends SchemaNodeBase {
  type: 'object'
  /** Ordered list of property definitions. */
  properties?: Array<PropertyNode>
}

/**
 * Schema for `'array'` and `'tuple'` types — carries item schemas.
 * `min` / `max` represent the minimum / maximum number of items.
 */
export interface ArraySchemaNode extends SchemaNodeBase {
  type: 'array' | 'tuple'
  /** Schema(s) describing array items. Single-element = homogeneous; multiple = tuple. */
  items?: Array<SchemaNode>
  /** Minimum number of items (`minItems` in JSON Schema / OAS). */
  min?: number
  /** Maximum number of items (`maxItems` in JSON Schema / OAS). */
  max?: number
  /** Whether all items must be unique (`uniqueItems` in JSON Schema / OAS). */
  unique?: boolean
}

/** Schema for `'union'` and `'intersection'` types — carries member schemas. */
export interface CompositeSchemaNode extends SchemaNodeBase {
  type: 'union' | 'intersection'
  /** Member schemas for union / intersection. */
  members?: Array<SchemaNode>
}

/** Schema for `'enum'` type — carries the list of allowed literal values. */
export interface EnumSchemaNode extends SchemaNodeBase {
  type: 'enum'
  /** List of allowed literal values. */
  enumValues?: Array<string | number | boolean | null>
}

/** Schema for `'ref'` type — carries the resolved reference identifier. */
export interface RefSchemaNode extends SchemaNodeBase {
  type: 'ref'
  /** The resolved reference identifier (e.g. schema name or import path). */
  ref?: string
  /**
   * Regex pattern constraint propagated from a sibling `pattern` field next to the `$ref`.
   * Only set when the referenced schema is a string type.
   */
  pattern?: string
}

/**
 * Schema for `'datetime'` type — carries timezone modifiers that cannot be
 * expressed on a plain scalar node.
 */
export interface DatetimeSchemaNode extends SchemaNodeBase {
  type: 'datetime'
  /**
   * Whether the datetime includes a timezone offset (`+00:00`).
   * Corresponds to `dateType: 'stringOffset'`.
   */
  offset?: boolean
  /**
   * Whether the datetime is a local (no timezone) datetime.
   * Corresponds to `dateType: 'stringLocal'`.
   */
  local?: boolean
}

/**
 * Schema for `'date'` type.
 * `representation: 'date'` produces a native `Date` object; `representation: 'string'` keeps it as a string.
 * Corresponds to `dateType: 'date'` vs any other string dateType.
 */
export interface DateSchemaNode extends SchemaNodeBase {
  type: 'date'
  /** How the date value is represented in generated code: native `Date` object or plain string. */
  representation: 'date' | 'string'
}

/**
 * Schema for `'time'` type.
 * `representation: 'date'` produces a native `Date` object; `representation: 'string'` keeps it as a string.
 * Corresponds to `dateType: 'date'` vs any other string dateType.
 */
export interface TimeSchemaNode extends SchemaNodeBase {
  type: 'time'
  /** How the time value is represented in generated code: native `Date` object or plain string. */
  representation: 'date' | 'string'
}

/** Schema for `'string'` type — carries length and pattern constraints. */
export interface StringSchemaNode extends SchemaNodeBase {
  type: 'string'
  /** Minimum character length (`minLength` in JSON Schema / OAS). */
  min?: number
  /** Maximum character length (`maxLength` in JSON Schema / OAS). */
  max?: number
  /** Regex pattern constraint (`pattern` in JSON Schema / OAS). */
  pattern?: string
}

/**
 * Schema for `'number'`, `'integer'`, and `'bigint'` types — carries numeric range constraints.
 * `exclusiveMinimum` / `exclusiveMaximum` follow JSON Schema draft 2019-09+ (numeric values, not booleans).
 */
export interface NumberSchemaNode extends SchemaNodeBase {
  type: 'number' | 'integer' | 'bigint'
  /** Minimum numeric value (`minimum` in JSON Schema / OAS). */
  min?: number
  /** Maximum numeric value (`maximum` in JSON Schema / OAS). */
  max?: number
  /** Exclusive lower bound (`exclusiveMinimum` as a number in JSON Schema draft 2019-09+). */
  exclusiveMinimum?: number
  /** Exclusive upper bound (`exclusiveMaximum` as a number in JSON Schema draft 2019-09+). */
  exclusiveMaximum?: number
}

/**
 * Schema for all remaining scalar types that carry no type-specific constraints:
 * booleans, null, any, unknown, void, and well-known semantic scalars (uuid, email, url, blob).
 */
export interface ScalarSchemaNode extends SchemaNodeBase {
  type: Exclude<SchemaType, 'object' | 'array' | 'tuple' | 'union' | 'intersection' | 'enum' | 'ref' | 'datetime' | 'date' | 'time' | 'string' | 'number' | 'integer' | 'bigint'>
}

/**
 * A spec-agnostic representation of a single schema definition.
 *
 * `SchemaNode` is a discriminated union on `type`, allowing callers to narrow
 * to the exact variant and access only the fields that are meaningful for that
 * schema kind.
 */
export type SchemaNode =
  | ObjectSchemaNode
  | ArraySchemaNode
  | CompositeSchemaNode
  | EnumSchemaNode
  | RefSchemaNode
  | DatetimeSchemaNode
  | DateSchemaNode
  | TimeSchemaNode
  | StringSchemaNode
  | NumberSchemaNode
  | ScalarSchemaNode
