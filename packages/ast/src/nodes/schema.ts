import type { BaseNode, DistributiveOmit } from './base.ts'
import type { PropertyNode } from './property.ts'

export type PrimitiveSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'bigint'
  | 'boolean'
  | 'null'
  | 'any'
  | 'unknown'
  | 'void'
  | 'never'
  | 'object'
  | 'array'
  | 'date'

/** All schema type strings, one per key of {@link SchemaNodeByType}. */
export type SchemaType = keyof SchemaNodeByType

/** Scalar schema types without extra object/array/ref structure or constraints. */
export type ScalarSchemaType = 'boolean' | 'null' | 'any' | 'unknown' | 'void' | 'never' | 'blob' | 'ipv4' | 'ipv6'

/** Fields shared by all schema nodes. */
type SchemaNodeBase = BaseNode & {
  kind: 'Schema'
  /**
   * Schema name for named definitions (for example `"Pet"`); inline schemas omit it. `null` means
   * Kubb determined there is no applicable name, `undefined` means the name has not been set yet.
   */
  name?: string | null
  title?: string
  description?: string
  nullable?: boolean
  optional?: boolean
  /** Both optional and nullable. */
  nullish?: boolean
  deprecated?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  default?: unknown
  examples?: Array<unknown>
  /** Base primitive type, for example `'string'` for a `uuid` schema. */
  primitive?: PrimitiveSchemaType
  /** Schema `format` value. */
  format?: string
}

/** Object schema with ordered properties. */
export type ObjectSchemaNode = SchemaNodeBase & {
  type: 'object'
  primitive: 'object'
  properties: Array<PropertyNode>
  /** `true` allows any value, `false` rejects unknown properties, a schema constrains them, `undefined` leaves the object open. */
  additionalProperties?: SchemaNode | boolean
  patternProperties?: Record<string, SchemaNode>
  minProperties?: number
  maxProperties?: number
}

/** Array-like schema (`array` or `tuple`). */
export type ArraySchemaNode = SchemaNodeBase & {
  type: 'array' | 'tuple'
  items?: Array<SchemaNode>
  /** Tuple rest-item schema for elements beyond positional `items`. */
  rest?: SchemaNode
  /** Minimum item count (or tuple length). */
  min?: number
  /** Maximum item count (or tuple length). */
  max?: number
  unique?: boolean
}

type CompositeSchemaNodeBase = SchemaNodeBase & {
  members?: Array<SchemaNode>
}

/** Union schema, often from `oneOf` or `anyOf`. */
export type UnionSchemaNode = CompositeSchemaNodeBase & {
  type: 'union'
  /** Discriminator property name for a polymorphic union. */
  discriminatorPropertyName?: string
  /** `'one'` requires exactly one valid member (`oneOf`), `'any'` any number (`anyOf`). */
  strategy?: 'one' | 'any'
}

/** Intersection schema, often from `allOf`. */
export type IntersectionSchemaNode = CompositeSchemaNodeBase & {
  type: 'intersection'
}

/** One named enum item. */
type EnumValueNode = {
  name: string
  value: string | number | boolean
  primitive: Extract<PrimitiveSchemaType, 'string' | 'number' | 'boolean'>
  /** From the `x-enumDescriptions` or `x-enum-descriptions` vendor extension; `@kubb/plugin-ts` renders it as JSDoc on the member. */
  description?: string
}

export type EnumSchemaNode = SchemaNodeBase & {
  type: 'enum'
  enumValues?: Array<string | number | boolean | null>
  /** Named form. If present, this is used instead of `enumValues`. */
  namedEnumValues?: Array<EnumValueNode>
}

/** Reference schema that points to another schema definition. */
export type RefSchemaNode = SchemaNodeBase & {
  type: 'ref'
  /** Referenced schema name. `null` means Kubb determined there is no applicable name. */
  name?: string | null
  /** Original `$ref` path, for example `#/components/schemas/Order`. */
  ref?: string
  /**
   * Emitted name of the referenced schema when it differs from the pointer's last segment,
   * for example after a collision rename (`Order` becomes `OrderSchema`) or a macro rename.
   * Resolve display and import names through `resolveRefName`, which prefers this field and
   * falls back to the pointer segment, then `name`.
   */
  targetName?: string
  /** Pattern copied from a sibling `pattern` field. */
  pattern?: string
  /**
   * The fully-parsed schema this ref resolves to, so its structure (`primitive`, `properties`)
   * can be read without following the reference. Populated during parsing when the
   * definition resolves, `null` when it can't or the ref is circular, and `undefined` when
   * resolution has not been attempted.
   */
  schema?: SchemaNode | null
}

export type DatetimeSchemaNode = SchemaNodeBase & {
  type: 'datetime'
  /** Includes a timezone offset (`dateType: 'stringOffset'`). */
  offset?: boolean
  /** Local datetime without timezone (`dateType: 'stringLocal'`). */
  local?: boolean
}

type TemporalSchemaNodeBase<T extends 'date' | 'time'> = SchemaNodeBase & {
  type: T
  /** Output representation in generated code. */
  representation: 'date' | 'string'
}

export type DateSchemaNode = TemporalSchemaNodeBase<'date'>

export type TimeSchemaNode = TemporalSchemaNodeBase<'time'>

export type StringSchemaNode = SchemaNodeBase & {
  type: 'string'
  /** Minimum string length. */
  min?: number
  /** Maximum string length. */
  max?: number
  /** Regex pattern. */
  pattern?: string
}

/** Numeric schema (`number`, `integer`, or `bigint`). */
export type NumberSchemaNode = SchemaNodeBase & {
  type: 'number' | 'integer' | 'bigint'
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

/** Scalar schema with no extra constraints. */
export type ScalarSchemaNode = SchemaNodeBase & {
  type: ScalarSchemaType
}

/** URL schema; `path` is a template for template literal types. */
export type UrlSchemaNode = SchemaNodeBase & {
  type: 'url'
  /** Path template, for example `'/pets/{petId}'`. */
  path?: string
  /** Minimum string length. */
  min?: number
  /** Maximum string length. */
  max?: number
}

/** String-based formats that support length constraints. */
type FormatStringSchemaNode = SchemaNodeBase & {
  type: 'uuid' | 'email'
  /** Minimum string length. */
  min?: number
  /** Maximum string length. */
  max?: number
}

/** Mapping from schema type literals to concrete schema node types. Used by `narrowSchema`. */
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
  uuid: FormatStringSchemaNode
  email: FormatStringSchemaNode
  url: UrlSchemaNode
  ipv4: ScalarSchemaNode
  ipv6: ScalarSchemaNode
  blob: ScalarSchemaNode
}

/** Union of all schema node types. */
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
  | FormatStringSchemaNode
  | ScalarSchemaNode

type CreateSchemaObjectInput = Omit<ObjectSchemaNode, 'kind' | 'properties' | 'primitive'> & { properties?: Array<PropertyNode>; primitive?: 'object' }
type CreateSchemaInput = CreateSchemaObjectInput | DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>
type CreateSchemaOutput<T extends CreateSchemaInput> = SchemaNodeByType[T['type']] & { kind: 'Schema' }

/**
 * Maps schema `type` to its underlying `primitive`.
 * Primitive types map to themselves and special string formats map to `'string'`.
 * Any type not listed here (such as `ref`, `enum`, `union`, `intersection`, `tuple`, `ipv4`, `ipv6`, `blob`) has no `primitive`.
 */
const TYPE_TO_PRIMITIVE: Partial<Record<SchemaNode['type'], PrimitiveSchemaType>> = {
  string: 'string',
  number: 'number',
  integer: 'integer',
  bigint: 'bigint',
  boolean: 'boolean',
  null: 'null',
  any: 'any',
  unknown: 'unknown',
  void: 'void',
  never: 'never',
  object: 'object',
  array: 'array',
  date: 'date',
  uuid: 'string',
  email: 'string',
  url: 'string',
  datetime: 'string',
  time: 'string',
}

/**
 * Creates a `SchemaNode`, narrowed to the variant of `props.type`. Object schemas default
 * `properties` to an empty array, and `primitive` is inferred from `type` when not explicitly provided.
 *
 * @example
 * ```ts
 * createSchema({ type: 'string' }) // { kind: 'Schema', type: 'string', primitive: 'string' }
 * createSchema({ type: 'object' }) // { kind: 'Schema', type: 'object', primitive: 'object', properties: [] }
 * ```
 */
export function createSchema<T extends CreateSchemaInput>(props: T): CreateSchemaOutput<T>
export function createSchema(props: CreateSchemaInput): SchemaNode
export function createSchema(props: CreateSchemaInput): SchemaNode {
  if (props.type === 'object') {
    return { properties: [], primitive: 'object', ...props, kind: 'Schema' }
  }

  return { primitive: TYPE_TO_PRIMITIVE[props.type], ...props, kind: 'Schema' }
}
