import type { InferSchemaNode } from '../infer.ts'
import { defineNode, type DistributiveOmit } from '../defineNode.ts'
import type { BaseNode } from './base.ts'
import type { PropertyNode } from './property.ts'

export type PrimitiveSchemaType =
  /**
   * Text value.
   */
  | 'string'
  /**
   * Floating-point number.
   */
  | 'number'
  /**
   * Integer number.
   */
  | 'integer'
  /**
   * Big integer number.
   */
  | 'bigint'
  /**
   * Boolean value.
   */
  | 'boolean'
  /**
   * Null value.
   */
  | 'null'
  /**
   * Any value.
   */
  | 'any'
  /**
   * Unknown value.
   */
  | 'unknown'
  /**
   * No value (`void`).
   */
  | 'void'
  /**
   * Never value.
   */
  | 'never'
  /**
   * Object value.
   */
  | 'object'
  /**
   * Array value.
   */
  | 'array'
  /**
   * Date value.
   */
  | 'date'

/**
 * Composite schema types.
 */
type ComplexSchemaType = 'tuple' | 'union' | 'intersection' | 'enum'

/**
 * Schema types that need special handling in generators.
 */
type SpecialSchemaType = 'ref' | 'datetime' | 'time' | 'uuid' | 'email' | 'url' | 'ipv4' | 'ipv6' | 'blob'

/**
 * All schema type strings.
 */
export type SchemaType = PrimitiveSchemaType | ComplexSchemaType | SpecialSchemaType

/**
 * Scalar schema types without extra object/array/ref structure.
 */
export type ScalarSchemaType = Exclude<
  SchemaType,
  | 'object'
  | 'array'
  | 'tuple'
  | 'union'
  | 'intersection'
  | 'enum'
  | 'ref'
  | 'datetime'
  | 'date'
  | 'time'
  | 'string'
  | 'number'
  | 'integer'
  | 'bigint'
  | 'url'
  | 'uuid'
  | 'email'
>

/**
 * Fields shared by all schema nodes.
 */
type SchemaNodeBase = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Schema'
  /**
   * Schema name for named definitions (for example, `"Pet"`).
   * Inline schemas omit this field.
   * `null` means Kubb has processed this and determined there is no applicable name.
   * `undefined` means the name has not been set yet.
   */
  name?: string | null
  /**
   * Short schema title.
   */
  title?: string
  /**
   * Schema description text.
   */
  description?: string
  /**
   * Whether `null` is allowed.
   */
  nullable?: boolean
  /**
   * Whether the field is optional.
   */
  optional?: boolean
  /**
   * Both optional and nullable (`optional` + `nullable`).
   */
  nullish?: boolean
  /**
   * Whether the schema is deprecated.
   */
  deprecated?: boolean
  /**
   * Whether the schema is read-only.
   */
  readOnly?: boolean
  /**
   * Whether the schema is write-only.
   */
  writeOnly?: boolean
  /**
   * Default value.
   */
  default?: unknown
  /**
   * Example values from an `examples` array.
   */
  examples?: Array<unknown>
  /**
   * Base primitive type.
   * For example, this is `'string'` for a `uuid` schema.
   */
  primitive?: PrimitiveSchemaType
  /**
   * Schema `format` value.
   */
  format?: string
}

/**
 * Object schema with ordered properties.
 *
 * @example
 * ```ts
 * const objectSchema: ObjectSchemaNode = {
 *   kind: 'Schema',
 *   type: 'object',
 *   properties: [],
 * }
 * ```
 */
export type ObjectSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'object'
  /**
   * Primitive type, always `'object'` for object schemas.
   */
  primitive: 'object'
  /**
   * Ordered object properties.
   */
  properties: Array<PropertyNode>
  /**
   * Additional object properties behavior:
   * - `true`: allow any value
   * - `false`: reject unknown properties
   * - `SchemaNode`: allow values that match that schema
   * - `undefined`: no additional properties constraint (open object)
   */
  additionalProperties?: SchemaNode | boolean
  /**
   * Pattern-based property schemas.
   */
  patternProperties?: Record<string, SchemaNode>
  /**
   * Minimum number of properties allowed.
   */
  minProperties?: number
  /**
   * Maximum number of properties allowed.
   */
  maxProperties?: number
}

/**
 * Array-like schema (`array` or `tuple`).
 *
 * @example
 * ```ts
 * const arraySchema: ArraySchemaNode = {
 *   kind: 'Schema',
 *   type: 'array',
 *   items: [],
 * }
 * ```
 */
export type ArraySchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator (`array` or `tuple`).
   */
  type: 'array' | 'tuple'
  /**
   * Item schemas.
   */
  items?: Array<SchemaNode>
  /**
   * Tuple rest-item schema for elements beyond positional `items`.
   */
  rest?: SchemaNode
  /**
   * Minimum item count (or tuple length).
   */
  min?: number
  /**
   * Maximum item count (or tuple length).
   */
  max?: number
  /**
   * Whether all items must be unique.
   */
  unique?: boolean
}

/**
 * Shared shape for union and intersection schemas.
 */
type CompositeSchemaNodeBase = SchemaNodeBase & {
  /**
   * Member schemas.
   */
  members?: Array<SchemaNode>
}

/**
 * Union schema, often from `oneOf` or `anyOf`.
 *
 * @example
 * ```ts
 * const unionSchema: UnionSchemaNode = {
 *   kind: 'Schema',
 *   type: 'union',
 *   members: [],
 * }
 * ```
 */
export type UnionSchemaNode = CompositeSchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'union'
  /**
   * Discriminator property name for a polymorphic union.
   */
  discriminatorPropertyName?: string
  /**
   * How many union members must be valid.
   * - `'one'`: exactly one member, from `oneOf`
   * - `'any'`: any number of members, from `anyOf`
   */
  strategy?: 'one' | 'any'
}

/**
 * Intersection schema, often from `allOf`.
 *
 * @example
 * ```ts
 * const intersectionSchema: IntersectionSchemaNode = {
 *   kind: 'Schema',
 *   type: 'intersection',
 *   members: [],
 * }
 * ```
 */
export type IntersectionSchemaNode = CompositeSchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'intersection'
}

/**
 * One named enum item.
 */
type EnumValueNode = {
  /**
   * Enum item name.
   */
  name: string
  /**
   * Enum item value.
   */
  value: string | number | boolean
  /**
   * Primitive type of the enum value.
   */
  primitive: Extract<PrimitiveSchemaType, 'string' | 'number' | 'boolean'>
  /**
   * Label for the enum item, taken from the `x-enumDescriptions` or
   * `x-enum-descriptions` vendor extension. `@kubb/plugin-ts` renders it as
   * JSDoc on the matching enum member.
   */
  description?: string
}

/**
 * Enum schema node.
 *
 * @example
 * ```ts
 * const enumSchema: EnumSchemaNode = {
 *   kind: 'Schema',
 *   type: 'enum',
 *   enumValues: ['a', 'b'],
 * }
 * ```
 */
export type EnumSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'enum'
  /**
   * Enum values in simple form.
   */
  enumValues?: Array<string | number | boolean | null>
  /**
   * Enum values in named form.
   * If present, this is used instead of `enumValues`.
   */
  namedEnumValues?: Array<EnumValueNode>
}

/**
 * Reference schema that points to another schema definition.
 *
 * @example
 * ```ts
 * const refSchema: RefSchemaNode = {
 *   kind: 'Schema',
 *   type: 'ref',
 *   ref: '#/components/schemas/Pet',
 * }
 * ```
 */
export type RefSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'ref'
  /**
   * Referenced schema name.
   * `null` means Kubb has processed this and determined there is no applicable name.
   */
  name?: string | null
  /**
   * Original `$ref` path, for example, `#/components/schemas/Order`.
   * Used to resolve names later.
   */
  ref?: string
  /**
   * Pattern copied from a sibling `pattern` field.
   */
  pattern?: string
  /**
   * The fully-parsed schema this ref resolves to, so its structure (`primitive`, `properties`)
   * can be read without following the reference. Populated during parsing when the
   * definition resolves, `null` when it can't or the ref is circular, and `undefined` when
   * resolution has not been attempted.
   */
  schema?: SchemaNode | null
}

/**
 * Datetime schema.
 *
 * @example
 * ```ts
 * const datetimeSchema: DatetimeSchemaNode = { kind: 'Schema', type: 'datetime' }
 * ```
 */
export type DatetimeSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'datetime'
  /**
   * Whether the datetime includes a timezone offset (`dateType: 'stringOffset'`).
   */
  offset?: boolean
  /**
   * Whether the datetime is local (no timezone, `dateType: 'stringLocal'`).
   */
  local?: boolean
}

/**
 * Shared base for `date` and `time` schemas.
 */
type TemporalSchemaNodeBase<T extends 'date' | 'time'> = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: T
  /**
   * Output representation in generated code.
   */
  representation: 'date' | 'string'
}

/**
 * Date schema node.
 *
 * @example
 * ```ts
 * const dateSchema: DateSchemaNode = { kind: 'Schema', type: 'date', representation: 'string' }
 * ```
 */
export type DateSchemaNode = TemporalSchemaNodeBase<'date'>

/**
 * Time schema node.
 *
 * @example
 * ```ts
 * const timeSchema: TimeSchemaNode = { kind: 'Schema', type: 'time', representation: 'string' }
 * ```
 */
export type TimeSchemaNode = TemporalSchemaNodeBase<'time'>

/**
 * String schema node.
 *
 * @example
 * ```ts
 * const stringSchema: StringSchemaNode = { kind: 'Schema', type: 'string' }
 * ```
 */
export type StringSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'string'
  /**
   * Minimum string length.
   */
  min?: number
  /**
   * Maximum string length.
   */
  max?: number
  /**
   * Regex pattern.
   */
  pattern?: string
}

/**
 * Numeric schema (`number`, `integer`, or `bigint`).
 *
 * @example
 * ```ts
 * const numberSchema: NumberSchemaNode = { kind: 'Schema', type: 'number' }
 * ```
 */
export type NumberSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'number' | 'integer' | 'bigint'
  /**
   * Minimum value.
   */
  min?: number
  /**
   * Maximum value.
   */
  max?: number
  /**
   * Exclusive minimum value.
   */
  exclusiveMinimum?: number
  /**
   * Exclusive maximum value.
   */
  exclusiveMaximum?: number
  /**
   * The value must be a multiple of this number.
   */
  multipleOf?: number
}

/**
 * Scalar schema with no extra constraints.
 *
 * @example
 * ```ts
 * const anySchema: ScalarSchemaNode = { kind: 'Schema', type: 'any' }
 * ```
 */
export type ScalarSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: ScalarSchemaType
}

/**
 * URL schema node.
 * Can include a path template for template literal types.
 *
 * @example
 * ```ts
 * const urlSchema: UrlSchemaNode = { kind: 'Schema', type: 'url', path: '/pets/{petId}' }
 * ```
 */
export type UrlSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'url'
  /**
   * Path template, for example, `'/pets/{petId}'`.
   */
  path?: string
  /**
   * Minimum string length.
   */
  min?: number
  /**
   * Maximum string length.
   */
  max?: number
}

/**
 * Format-string schema for string-based formats that support length constraints.
 *
 * @example
 * ```ts
 * const uuidSchema: FormatStringSchemaNode = { kind: 'Schema', type: 'uuid', min: 36, max: 36 }
 * ```
 */
type FormatStringSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'uuid' | 'email'
  /**
   * Minimum string length.
   */
  min?: number
  /**
   * Maximum string length.
   */
  max?: number
}

/**
 * IPv4 address schema node.
 *
 * @example
 * ```ts
 * const ipv4Schema: Ipv4SchemaNode = { kind: 'Schema', type: 'ipv4' }
 * ```
 */
type Ipv4SchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'ipv4'
}

/**
 * IPv6 address schema node.
 *
 * @example
 * ```ts
 * const ipv6Schema: Ipv6SchemaNode = { kind: 'Schema', type: 'ipv6' }
 * ```
 */
type Ipv6SchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'ipv6'
}

/**
 * Mapping from schema type literals to concrete schema node types.
 * Used by `narrowSchema`.
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
  uuid: FormatStringSchemaNode
  email: FormatStringSchemaNode
  url: UrlSchemaNode
  ipv4: Ipv4SchemaNode
  ipv6: Ipv6SchemaNode
  blob: ScalarSchemaNode
}

/**
 * Union of all schema node types.
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
  | FormatStringSchemaNode
  | Ipv4SchemaNode
  | Ipv6SchemaNode
  | ScalarSchemaNode

type CreateSchemaObjectInput = Omit<ObjectSchemaNode, 'kind' | 'properties' | 'primitive'> & { properties?: Array<PropertyNode>; primitive?: 'object' }
type CreateSchemaInput = CreateSchemaObjectInput | DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>
type CreateSchemaOutput<T extends CreateSchemaInput> = InferSchemaNode<T> & {
  kind: 'Schema'
}

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
 * Definition for the {@link SchemaNode}. Object schemas default `properties` to an
 * empty array, and `primitive` is inferred from `type` when not explicitly provided.
 */
export const schemaDef = defineNode<SchemaNode, CreateSchemaInput>({
  kind: 'Schema',
  build: (props) => {
    if (props.type === 'object') {
      return { properties: [], primitive: 'object' as const, ...props }
    }

    return { primitive: TYPE_TO_PRIMITIVE[props.type as keyof typeof TYPE_TO_PRIMITIVE], ...props }
  },
  children: ['properties', 'items', 'members', 'additionalProperties'],
  visitorKey: 'schema',
})

/**
 * Creates a `SchemaNode`, narrowed to the variant of `props.type`.
 *
 * @example
 * ```ts
 * const scalar = createSchema({ type: 'string' })
 * // { kind: 'Schema', type: 'string', primitive: 'string' }
 * ```
 *
 * @example
 * ```ts
 * const object = createSchema({ type: 'object' })
 * // { kind: 'Schema', type: 'object', primitive: 'object', properties: [] }
 * ```
 */
export function createSchema<T extends CreateSchemaInput>(props: T): CreateSchemaOutput<T>
export function createSchema(props: CreateSchemaInput): SchemaNode
export function createSchema(props: CreateSchemaInput): SchemaNode {
  return schemaDef.create(props)
}
