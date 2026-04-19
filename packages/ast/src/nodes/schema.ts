import type { BaseNode } from "./base.ts";
import type { PropertyNode } from "./property.ts";

export type PrimitiveSchemaType =
  /**
   * Text value.
   */
  | "string"
  /**
   * Floating-point number.
   */
  | "number"
  /**
   * Integer number.
   */
  | "integer"
  /**
   * Big integer number.
   */
  | "bigint"
  /**
   * Boolean value.
   */
  | "boolean"
  /**
   * Null value.
   */
  | "null"
  /**
   * Any value.
   */
  | "any"
  /**
   * Unknown value.
   */
  | "unknown"
  /**
   * No value (`void`).
   */
  | "void"
  /**
   * Never value.
   */
  | "never"
  /**
   * Object value.
   */
  | "object"
  /**
   * Array value.
   */
  | "array"
  /**
   * Date value.
   */
  | "date";

/**
 * Composite schema types.
 */
export type ComplexSchemaType = "tuple" | "union" | "intersection" | "enum";

/**
 * Schema types that need special handling in generators.
 */
export type SpecialSchemaType =
  | "ref"
  | "datetime"
  | "time"
  | "uuid"
  | "email"
  | "url"
  | "ipv4"
  | "ipv6"
  | "blob";

/**
 * All schema type strings.
 */
export type SchemaType =
  | PrimitiveSchemaType
  | ComplexSchemaType
  | SpecialSchemaType;

/**
 * Scalar schema types without extra object/array/ref structure.
 */
export type ScalarSchemaType = Exclude<
  SchemaType,
  | "object"
  | "array"
  | "tuple"
  | "union"
  | "intersection"
  | "enum"
  | "ref"
  | "datetime"
  | "date"
  | "time"
  | "string"
  | "number"
  | "integer"
  | "bigint"
  | "url"
  | "uuid"
  | "email"
>;

/**
 * Fields shared by all schema nodes.
 */
type SchemaNodeBase = BaseNode & {
  /**
   * Node kind.
   */
  kind: "Schema";
  /**
   * Schema name for named definitions (for example, `"Pet"`).
   * Inline schemas omit this field.
   * `null` means kubb has processed this and determined there is no applicable name.
   * `undefined` means the name has not been set yet.
   */
  name?: string | null;
  /**
   * Short schema title.
   */
  title?: string;
  /**
   * Schema description text.
   */
  description?: string;
  /**
   * Whether `null` is allowed.
   */
  nullable?: boolean;
  /**
   * Whether the field is optional.
   */
  optional?: boolean;
  /**
   * Both optional and nullable (`optional` + `nullable`).
   */
  nullish?: boolean;
  /**
   * Whether the schema is deprecated.
   */
  deprecated?: boolean;
  /**
   * Whether the schema is read-only.
   */
  readOnly?: boolean;
  /**
   * Whether the schema is write-only.
   */
  writeOnly?: boolean;
  /**
   * Default value.
   */
  default?: unknown;
  /**
   * Example value.
   */
  example?: unknown;
  /**
   * Base primitive type.
   * For example, this is `'string'` for a `uuid` schema.
   */
  primitive?: PrimitiveSchemaType;
};

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
  type: "object";
  /**
   * Primitive type — always `'object'` for object schemas.
   */
  primitive: "object";
  /**
   * Ordered object properties.
   */
  properties: Array<PropertyNode>;
  /**
   * Additional object properties behavior:
   * - `true`: allow any value
   * - `false`: reject unknown properties (maps to `.strict()` in Zod)
   * - `SchemaNode`: allow values that match that schema
   * - `undefined`: no additional properties constraint (open object)
   */
  additionalProperties?: SchemaNode | boolean;
  /**
   * Pattern-based property schemas.
   */
  patternProperties?: Record<string, SchemaNode>;
  /**
   * Minimum number of properties allowed.
   */
  minProperties?: number;
  /**
   * Maximum number of properties allowed.
   */
  maxProperties?: number;
};

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
  type: "array" | "tuple";
  /**
   * Item schemas.
   */
  items?: Array<SchemaNode>;
  /**
   * Tuple rest-item schema for elements beyond positional `items`.
   */
  rest?: SchemaNode;
  /**
   * Minimum item count (or tuple length).
   */
  min?: number;
  /**
   * Maximum item count (or tuple length).
   */
  max?: number;
  /**
   * Whether all items must be unique.
   */
  unique?: boolean;
};

/**
 * Shared shape for union and intersection schemas.
 */
type CompositeSchemaNodeBase = SchemaNodeBase & {
  /**
   * Member schemas.
   */
  members?: Array<SchemaNode>;
};

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
  type: "union";
  /**
   * Discriminator property name from OpenAPI `discriminator.propertyName`.
   */
  discriminatorPropertyName?: string;
};

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
  type: "intersection";
};

/**
 * One named enum item.
 */
export type EnumValueNode = {
  /**
   * Enum item name.
   */
  name: string;
  /**
   * Enum item value.
   */
  value: string | number | boolean;
  /**
   * Primitive type of the enum value.
   */
  primitive: Extract<PrimitiveSchemaType, "string" | "number" | "boolean">;
};

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
  type: "enum";
  /**
   * Enum values in simple form.
   */
  enumValues?: Array<string | number | boolean | null>;
  /**
   * Enum values in named form.
   * If present, this is used instead of `enumValues`.
   */
  namedEnumValues?: Array<EnumValueNode>;
};

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
  type: "ref";
  /**
   * Referenced schema name.
   */
  name?: string;
  /**
   * Original `$ref` path, for example, `#/components/schemas/Order`.
   * Used to resolve names later.
   */
  ref?: string;
  /**
   * Pattern copied from a sibling `pattern` field.
   */
  pattern?: string;
  /**
   * The fully-parsed schema that this ref resolves to.
   * Populated during OAS parsing when the referenced definition can be resolved.
   * `undefined` when the ref cannot be resolved or is part of a circular chain.
   *
   * Useful for inspecting the referenced schema's structure (e.g. `primitive`, `properties`)
   * without following the reference manually.
   */
  schema?: SchemaNode;
};

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
  type: "datetime";
  /**
   * Whether the datetime includes a timezone offset (`dateType: 'stringOffset'`).
   */
  offset?: boolean;
  /**
   * Whether the datetime is local (no timezone, `dateType: 'stringLocal'`).
   */
  local?: boolean;
};

/**
 * Shared base for `date` and `time` schemas.
 */
type TemporalSchemaNodeBase<T extends "date" | "time"> = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: T;
  /**
   * Output representation in generated code.
   */
  representation: "date" | "string";
};

/**
 * Date schema node.
 *
 * @example
 * ```ts
 * const dateSchema: DateSchemaNode = { kind: 'Schema', type: 'date', representation: 'string' }
 * ```
 */
export type DateSchemaNode = TemporalSchemaNodeBase<"date">;

/**
 * Time schema node.
 *
 * @example
 * ```ts
 * const timeSchema: TimeSchemaNode = { kind: 'Schema', type: 'time', representation: 'string' }
 * ```
 */
export type TimeSchemaNode = TemporalSchemaNodeBase<"time">;

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
  type: "string";
  /**
   * Minimum string length.
   */
  min?: number;
  /**
   * Maximum string length.
   */
  max?: number;
  /**
   * Regex pattern.
   */
  pattern?: string;
};

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
  type: "number" | "integer" | "bigint";
  /**
   * Minimum value.
   */
  min?: number;
  /**
   * Maximum value.
   */
  max?: number;
  /**
   * Exclusive minimum value.
   */
  exclusiveMinimum?: number;
  /**
   * Exclusive maximum value.
   */
  exclusiveMaximum?: number;
  /**
   * The value must be a multiple of this number.
   */
  multipleOf?: number;
};

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
  type: ScalarSchemaType;
};

/**
 * URL schema node.
 * Can include an OpenAPI-style path template for template literal types.
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
  type: "url";
  /**
   * OpenAPI-style path template, for example, `'/pets/{petId}'`.
   */
  path?: string;
  /**
   * Minimum string length.
   */
  min?: number;
  /**
   * Maximum string length.
   */
  max?: number;
};

/**
 * Format-string schema for string-based formats that support length constraints.
 *
 * @example
 * ```ts
 * const uuidSchema: FormatStringSchemaNode = { kind: 'Schema', type: 'uuid', min: 36, max: 36 }
 * ```
 */
export type FormatStringSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: "uuid" | "email";
  /**
   * Minimum string length.
   */
  min?: number;
  /**
   * Maximum string length.
   */
  max?: number;
};

/**
 * IPv4 address schema node.
 *
 * @example
 * ```ts
 * const ipv4Schema: Ipv4SchemaNode = { kind: 'Schema', type: 'ipv4' }
 * ```
 */
export type Ipv4SchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: "ipv4";
};

/**
 * IPv6 address schema node.
 *
 * @example
 * ```ts
 * const ipv6Schema: Ipv6SchemaNode = { kind: 'Schema', type: 'ipv6' }
 * ```
 */
export type Ipv6SchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: "ipv6";
};

/**
 * Mapping from schema type literals to concrete schema node types.
 * Used by `narrowSchema`.
 */
export type SchemaNodeByType = {
  object: ObjectSchemaNode;
  array: ArraySchemaNode;
  tuple: ArraySchemaNode;
  union: UnionSchemaNode;
  intersection: IntersectionSchemaNode;
  enum: EnumSchemaNode;
  ref: RefSchemaNode;
  datetime: DatetimeSchemaNode;
  date: DateSchemaNode;
  time: TimeSchemaNode;
  string: StringSchemaNode;
  number: NumberSchemaNode;
  integer: NumberSchemaNode;
  bigint: NumberSchemaNode;
  boolean: ScalarSchemaNode;
  null: ScalarSchemaNode;
  any: ScalarSchemaNode;
  unknown: ScalarSchemaNode;
  void: ScalarSchemaNode;
  never: ScalarSchemaNode;
  uuid: FormatStringSchemaNode;
  email: FormatStringSchemaNode;
  url: UrlSchemaNode;
  ipv4: Ipv4SchemaNode;
  ipv6: Ipv6SchemaNode;
  blob: ScalarSchemaNode;
};

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
  | ScalarSchemaNode;
