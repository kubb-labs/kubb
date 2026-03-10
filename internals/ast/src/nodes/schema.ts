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

import type { BaseNode } from './base.ts'
import type { PropertyNode } from './property.ts'

/**
 * A spec-agnostic representation of a single schema definition.
 *
 * `SchemaNode` intentionally does **not** carry any OpenAPI / JSON Schema
 * specific fields. Parsers (e.g. `plugin-oas`) are responsible for
 * converting specification-specific constructs into this normalized form.
 */
export interface SchemaNode extends BaseNode {
  kind: 'Schema'
  /**
   * The canonical name of this schema when it is a named/reusable definition
   * (e.g. `"Pet"` from `#/components/schemas/Pet`). May be `undefined` for
   * inline anonymous schemas.
   */
  name?: string
  /** The normalized type of this schema. */
  type: SchemaType
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
  /**
   * For `'ref'` types, the resolved reference identifier (e.g. the schema
   * name or import path that another plugin should emit).
   */
  ref?: string
  /**
   * For `'object'` types, the ordered list of property definitions.
   * For `'enum'` types this is empty — use `enumValues` instead.
   */
  properties?: Array<PropertyNode>
  /**
   * For `'array'` and `'tuple'` types, the schema(s) describing array
   * items. A single-element array describes a homogeneous array; multiple
   * elements describe a tuple.
   */
  items?: Array<SchemaNode>
  /**
   * For `'union'` and `'intersection'` types, the member schemas.
   */
  members?: Array<SchemaNode>
  /** For `'enum'` types, the list of allowed literal values. */
  enumValues?: Array<string | number | boolean | null>
  /** Validation constraints. */
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  pattern?: string
  /** A concrete default value for this schema. */
  default?: unknown
  /** An example value for this schema. */
  example?: unknown
}
