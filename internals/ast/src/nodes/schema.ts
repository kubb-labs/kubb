/**
 * Spec-agnostic schema type system.
 *
 * These types map directly to the kinds of values that can appear in any API
 * schema language (OpenAPI, JSON Schema, Protobuf, …) without being coupled
 * to any of them.
 */

/** Primitive scalar types. */
export type PrimitiveSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'any' | 'unknown' | 'void'

/** Structural / composite types. */
export type ComplexSchemaType = 'object' | 'array' | 'tuple' | 'union' | 'intersection' | 'enum'

/**
 * Well-known semantic types that most code-generators want to handle
 * specially (e.g. generate a `Date` object or a branded type).
 */
export type SpecialSchemaType = 'ref' | 'date' | 'datetime' | 'time' | 'uuid' | 'email' | 'url' | 'blob'

/** All possible schema types. */
export type SchemaType = PrimitiveSchemaType | ComplexSchemaType | SpecialSchemaType

/** Runtime constants for all schema type values. */
export const schemaTypes = {
  // Primitive scalar types
  string: 'string',
  number: 'number',
  integer: 'integer',
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
  /** Regex pattern constraint (e.g. `pattern` from JSON Schema / OAS). */
  pattern?: string
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
}

/**
 * Schema for primitive scalar types and well-known semantic types
 * (everything that is not `object`, `array`, `tuple`, `union`, `intersection`, `enum`, or `ref`).
 *
 * `min` / `max` are interpreted according to `type`:
 * - `'string'`: minimum / maximum character length (`minLength` / `maxLength`).
 * - `'number'` / `'integer'`: minimum / maximum value (`minimum` / `maximum`).
 * - Other scalars (e.g. `'date'`, `'uuid'`): not typically used.
 */
export interface ScalarSchemaNode extends SchemaNodeBase {
  type: Exclude<SchemaType, 'object' | 'array' | 'tuple' | 'union' | 'intersection' | 'enum' | 'ref'>
  /**
   * Minimum constraint.
   * - `'string'`: minimum character length.
   * - `'number'` / `'integer'`: minimum numeric value.
   */
  min?: number
  /**
   * Maximum constraint.
   * - `'string'`: maximum character length.
   * - `'number'` / `'integer'`: maximum numeric value.
   */
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
}

/**
 * A spec-agnostic representation of a single schema definition.
 *
 * `SchemaNode` is a discriminated union on `type`, allowing callers to narrow
 * to the exact variant and access only the fields that are meaningful for that
 * schema kind.
 */
export type SchemaNode = ObjectSchemaNode | ArraySchemaNode | CompositeSchemaNode | EnumSchemaNode | RefSchemaNode | ScalarSchemaNode
