import type { BaseNode } from './base.ts'
import type { PropertyNode } from './property.ts'

export type PrimitiveSchemaType = 'string' | 'number' | 'integer' | 'bigint' | 'boolean' | 'null' | 'any' | 'unknown' | 'void' | 'never' | 'object' | 'array' | 'date'

export type ComplexSchemaType = 'tuple' | 'union' | 'intersection' | 'enum'

/**
 * Semantic types requiring special handling in code generation (e.g. generating a `Date` object or a branded type).
 */
export type SpecialSchemaType = 'ref' | 'datetime' | 'time' | 'uuid' | 'email' | 'url' | 'blob'

export type SchemaType = PrimitiveSchemaType | ComplexSchemaType | SpecialSchemaType

export type ScalarSchemaType = Exclude<
  SchemaType,
  'object' | 'array' | 'tuple' | 'union' | 'intersection' | 'enum' | 'ref' | 'datetime' | 'date' | 'time' | 'string' | 'number' | 'integer' | 'bigint' | 'url'
>

/**
 * Base fields shared by every schema variant. Does not include spec-specific fields.
 */
type SchemaNodeBase = BaseNode & {
  kind: 'Schema'
  /**
   * Named schema identifier (e.g. `"Pet"` from `#/components/schemas/Pet`). `undefined` for inline schemas.
   */
  name?: string
  title?: string
  description?: string
  nullable?: boolean
  optional?: boolean
  /**
   * Both optional and nullable (`optional` + `nullable`).
   */
  nullish?: boolean
  deprecated?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  default?: unknown
  example?: unknown
  /**
   * Underlying primitive before format/semantic promotion (e.g. `'string'` for a `uuid` node).
   */
  primitive?: PrimitiveSchemaType
}

/**
 * Object schema with ordered property definitions.
 */
export type ObjectSchemaNode = SchemaNodeBase & {
  type: 'object'
  properties: Array<PropertyNode>
  /**
   * `true` allows any value; a `SchemaNode` constrains it; absent means not permitted.
   */
  additionalProperties?: SchemaNode | true
  patternProperties?: Record<string, SchemaNode>
}

/**
 * Array or tuple schema.
 */
export type ArraySchemaNode = SchemaNodeBase & {
  type: 'array' | 'tuple'
  items?: Array<SchemaNode>
  /**
   * Additional items beyond positional `items` in a tuple.
   */
  rest?: SchemaNode
  min?: number
  max?: number
  unique?: boolean
}

/**
 * Shared base for union and intersection schemas.
 */
type CompositeSchemaNodeBase = SchemaNodeBase & {
  members?: Array<SchemaNode>
}

/**
 * Union schema (`oneOf` / `anyOf`).
 */
export type UnionSchemaNode = CompositeSchemaNodeBase & {
  type: 'union'
  /**
   * Discriminator property from OAS `discriminator.propertyName`.
   */
  discriminatorPropertyName?: string
}

/**
 * Intersection schema (`allOf`).
 */
export type IntersectionSchemaNode = CompositeSchemaNodeBase & {
  type: 'intersection'
}

/**
 * A named enum variant.
 */
export type EnumValueNode = {
  name: string
  value: string | number | boolean
  format: 'string' | 'number' | 'boolean'
}

/**
 * Enum schema.
 */
export type EnumSchemaNode = SchemaNodeBase & {
  type: 'enum'
  /**
   * Enum member type. Generators should use const assertions for `'number'` / `'boolean'`.
   */
  enumType?: 'string' | 'number' | 'boolean'
  /**
   * Allowed values (simple form).
   */
  enumValues?: Array<string | number | boolean | null>
  /**
   * Named variants (rich form). Takes priority over `enumValues` when present.
   */
  namedEnumValues?: Array<EnumValueNode>
}

/**
 * Ref schema — pointer to another schema definition.
 */
export type RefSchemaNode = SchemaNodeBase & {
  type: 'ref'
  name?: string
  /**
   * Original `$ref` path (e.g. `#/components/schemas/Order`). Used for name resolution.
   */
  ref?: string
  /**
   * Pattern constraint propagated from a sibling `pattern` field next to the `$ref`.
   */
  pattern?: string
}

/**
 * Datetime schema.
 */
export type DatetimeSchemaNode = SchemaNodeBase & {
  type: 'datetime'
  /**
   * Includes timezone offset (`dateType: 'stringOffset'`).
   */
  offset?: boolean
  /**
   * Local datetime without timezone (`dateType: 'stringLocal'`).
   */
  local?: boolean
}

/**
 * Base for `date` and `time` schemas.
 */
type TemporalSchemaNodeBase<T extends 'date' | 'time'> = SchemaNodeBase & {
  type: T
  /**
   * Representation in generated code: native `Date` or plain string.
   */
  representation: 'date' | 'string'
}

/**
 * Date schema.
 */
export type DateSchemaNode = TemporalSchemaNodeBase<'date'>

/**
 * Time schema.
 */
export type TimeSchemaNode = TemporalSchemaNodeBase<'time'>

/**
 * String schema.
 */
export type StringSchemaNode = SchemaNodeBase & {
  type: 'string'
  min?: number
  max?: number
  pattern?: string
}

/**
 * Number, integer, or bigint schema.
 */
export type NumberSchemaNode = SchemaNodeBase & {
  type: 'number' | 'integer' | 'bigint'
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
}

/**
 * Schema for scalar types with no additional constraints.
 */
export type ScalarSchemaNode = SchemaNodeBase & {
  type: ScalarSchemaType
}

/**
 * URL schema, optionally carrying an Express-style path template for template literal generation.
 */
export type UrlSchemaNode = SchemaNodeBase & {
  type: 'url'
  /**
   * Express-style path (e.g. `'/pets/:petId'`). When set, printers may emit a template literal type.
   */
  path?: string
}

/**
 * Maps each schema type string to its `SchemaNode` variant. Used by `narrowSchema`.
 */
export type SchemaNodeByType = {
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
  never: ScalarSchemaNode
  uuid: ScalarSchemaNode
  email: ScalarSchemaNode
  url: UrlSchemaNode
  blob: ScalarSchemaNode
}

/**
 * Discriminated union of all schema variants.
 */
export type SchemaNode =
  | ObjectSchemaNode
  | ArraySchemaNode
  | UnionSchemaNode
  | IntersectionSchemaNode
  | EnumSchemaNode
  | RefSchemaNode
  | DatetimeSchemaNode
  | DateSchemaNode
  | TimeSchemaNode
  | StringSchemaNode
  | NumberSchemaNode
  | UrlSchemaNode
  | ScalarSchemaNode
