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
} from "./nodes/index.ts";

/**
 * Shared parser options used by OAS-to-AST inference and parser flows.
 */
export type ParserOptions = {
  /**
   * How `format: 'date-time'` schemas are represented. `false` falls through to a plain string.
   */
  dateType: false | "string" | "stringOffset" | "stringLocal" | "date";
  /**
   * Whether `type: 'integer'` and `format: 'int64'` produce `number` or `bigint` nodes.
   */
  integerType?: "number" | "bigint";
  /**
   * AST type used when no schema type can be inferred.
   */
  unknownType: "any" | "unknown" | "void";
  /**
   * AST type used for completely empty schemas (`{}`).
   */
  emptySchemaType: "any" | "unknown" | "void";
  /**
   * Suffix appended to derived enum names when building property schema names.
   */
  enumSuffix: "enum" | (string & {});
};

/**
 * Maps each `dateType` option value to the AST node produced by `format: 'date-time'`.
 */
type DateTimeNodeByDateType = {
  date: DateSchemaNode;
  string: DatetimeSchemaNode;
  stringOffset: DatetimeSchemaNode;
  stringLocal: DatetimeSchemaNode;
  false: StringSchemaNode;
};

/**
 * Resolves the AST node produced by `format: 'date-time'` based on the `dateType` option.
 */
type ResolveDateTimeNode<TDateType extends ParserOptions["dateType"]> =
  DateTimeNodeByDateType[TDateType extends keyof DateTimeNodeByDateType
    ? TDateType
    : "string"];

/**
 * Ordered list of `[schema-shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the first matching node type.
 */
type SchemaNodeMap<TDateType extends ParserOptions["dateType"] = "string"> = [
  [{ $ref: string }, RefSchemaNode],
  [
    { allOf: ReadonlyArray<unknown>; properties: object },
    IntersectionSchemaNode,
  ],
  [
    { allOf: readonly [unknown, unknown, ...unknown[]] },
    IntersectionSchemaNode,
  ],
  [{ allOf: ReadonlyArray<unknown> }, SchemaNode],
  [{ oneOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ anyOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ const: null }, ScalarSchemaNode],
  [{ const: string | number | boolean }, EnumSchemaNode],
  [{ type: ReadonlyArray<string> }, UnionSchemaNode],
  [{ type: "array"; enum: ReadonlyArray<unknown> }, ArraySchemaNode],
  [{ enum: ReadonlyArray<unknown> }, EnumSchemaNode],
  [{ type: "enum" }, EnumSchemaNode],
  [{ type: "union" }, UnionSchemaNode],
  [{ type: "intersection" }, IntersectionSchemaNode],
  [{ type: "tuple" }, ArraySchemaNode],
  [{ type: "ref" }, RefSchemaNode],
  [{ type: "datetime" }, DatetimeSchemaNode],
  [{ type: "date" }, DateSchemaNode],
  [{ type: "time" }, TimeSchemaNode],
  [{ type: "url" }, UrlSchemaNode],
  [{ type: "object" }, ObjectSchemaNode],
  [{ additionalProperties: boolean | {} }, ObjectSchemaNode],
  [{ type: "array" }, ArraySchemaNode],
  [{ items: object }, ArraySchemaNode],
  [{ prefixItems: ReadonlyArray<unknown> }, ArraySchemaNode],
  [{ type: string; format: "date-time" }, ResolveDateTimeNode<TDateType>],
  [{ type: string; format: "date" }, DateSchemaNode],
  [{ type: string; format: "time" }, TimeSchemaNode],
  [{ format: "date-time" }, ResolveDateTimeNode<TDateType>],
  [{ format: "date" }, DateSchemaNode],
  [{ format: "time" }, TimeSchemaNode],
  [{ type: "string" }, StringSchemaNode],
  [{ type: "number" }, NumberSchemaNode],
  [{ type: "integer" }, NumberSchemaNode],
  [{ type: "bigint" }, NumberSchemaNode],
  [{ type: string }, ScalarSchemaNode],
  [{ minLength: number }, StringSchemaNode],
  [{ maxLength: number }, StringSchemaNode],
  [{ pattern: string }, StringSchemaNode],
  [{ minimum: number }, NumberSchemaNode],
  [{ maximum: number }, NumberSchemaNode],
];

/**
 * Infers the matching AST `SchemaNode` type from an input schema shape.
 */
export type InferSchemaNode<
  TSchema extends object,
  TDateType extends ParserOptions["dateType"] = "string",
  TEntries extends ReadonlyArray<[object, SchemaNode]> =
    SchemaNodeMap<TDateType>,
> = TEntries extends [
  infer TEntry extends [object, SchemaNode],
  ...infer TRest extends ReadonlyArray<[object, SchemaNode]>,
]
  ? TSchema extends TEntry[0]
    ? TEntry[1]
    : InferSchemaNode<TSchema, TDateType, TRest>
  : SchemaNode;

/**
 * Backward-compatible alias for `InferSchemaNode`.
 */
export type InferSchema<
  TSchema extends object,
  TDateType extends ParserOptions["dateType"] = "string",
  TEntries extends ReadonlyArray<[object, SchemaNode]> =
    SchemaNodeMap<TDateType>,
> = InferSchemaNode<TSchema, TDateType, TEntries>;
