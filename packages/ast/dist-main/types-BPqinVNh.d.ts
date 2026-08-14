import { n as __name } from "./rolldown-runtime-CNktS9qV.js";
//#region src/constants.d.ts
/**
 * Traversal depth for AST visitor utilities.
 *
 * - `'shallow'` recurses through every node except nested `Schema` subtrees, which it treats as
 *   leaves: a schema node itself is visited, but its children are not.
 * - `'deep'` recursively visits all descendant nodes, including schema subtrees.
 */
type VisitorDepth = 'shallow' | 'deep';
/**
 * Schema type discriminators used by all AST schema nodes.
 *
 * Each value is a stable discriminator across the AST (for example `schema.type === schemaTypes.object`).
 */
declare const schemaTypes: {
  /**
   * Text value.
   */
  readonly string: "string";
  /**
   * Floating-point number (`float`, `double`).
   */
  readonly number: "number";
  /**
   * Whole number (`int32`). Use `bigint` for `int64`.
   */
  readonly integer: "integer";
  /**
   * 64-bit integer (`int64`). Only used when `integerType` is set to `'bigint'`.
   */
  readonly bigint: "bigint";
  /**
   * Boolean value.
   */
  readonly boolean: "boolean";
  /**
   * Explicit null value.
   */
  readonly null: "null";
  /**
   * Any value (no type restriction).
   */
  readonly any: "any";
  /**
   * Unknown value (must be narrowed before usage).
   */
  readonly unknown: "unknown";
  /**
   * No return value (`void`).
   */
  readonly void: "void";
  /**
   * Object with named properties.
   */
  readonly object: "object";
  /**
   * Sequential list of items.
   */
  readonly array: "array";
  /**
   * Fixed-length list with position-specific items.
   */
  readonly tuple: "tuple";
  /**
   * "One of" multiple schema members.
   */
  readonly union: "union";
  /**
   * "All of" multiple schema members.
   */
  readonly intersection: "intersection";
  /**
   * Enum schema.
   */
  readonly enum: "enum";
  /**
   * Reference to another schema.
   */
  readonly ref: "ref";
  /**
   * Calendar date (for example `2026-03-24`).
   */
  readonly date: "date";
  /**
   * Date-time value (for example `2026-03-24T09:00:00Z`).
   */
  readonly datetime: "datetime";
  /**
   * Time-only value (for example `09:00:00`).
   */
  readonly time: "time";
  /**
   * UUID value.
   */
  readonly uuid: "uuid";
  /**
   * Email address value.
   */
  readonly email: "email";
  /**
   * URL value.
   */
  readonly url: "url";
  /**
   * IPv4 address value.
   */
  readonly ipv4: "ipv4";
  /**
   * IPv6 address value.
   */
  readonly ipv6: "ipv6";
  /**
   * Binary/blob value.
   */
  readonly blob: "blob";
  /**
   * Impossible value (`never`).
   */
  readonly never: "never";
};
//#endregion
//#region src/nodes/base.d.ts
/**
 * `kind` values used by AST nodes.
 *
 * @example
 * ```ts
 * const kind: NodeKind = 'Schema'
 * ```
 */
type NodeKind = 'Input' | 'Output' | 'Operation' | 'Schema' | 'Property' | 'Parameter' | 'Response' | 'RequestBody' | 'Content' | 'Type' | 'File' | 'Import' | 'Export' | 'Source' | 'Const' | 'Function' | 'ArrowFunction' | 'Text' | 'Break' | 'Jsx';
/**
 * Base shape shared by all AST nodes.
 *
 * @example
 * ```ts
 * const base: BaseNode = { kind: 'Input' }
 * ```
 */
type BaseNode = {
  /**
   * Node discriminator.
   */
  kind: NodeKind;
};
//#endregion
//#region src/defineNode.d.ts
/**
 * Visitor callback names, one per traversable node kind, in traversal order.
 * Kept in sync with the keys of `Visitor` in `visitor.ts`.
 */
declare const visitorKeys: readonly ["input", "output", "operation", "schema", "property", "parameter", "response"];
/**
 * One of the {@link visitorKeys} callback names.
 */
type VisitorKey = (typeof visitorKeys)[number];
/**
 * Distributive `Omit` that preserves each member of a union.
 *
 * @example
 * ```ts
 * type A = { kind: 'a'; keep: string; drop: number }
 * type B = { kind: 'b'; keep: boolean; drop: number }
 * type Result = DistributiveOmit<A | B, 'drop'>
 * // -> { kind: 'a'; keep: string } | { kind: 'b'; keep: boolean }
 * ```
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/**
 * The single definition derived from one {@link defineNode} call: the node's
 * `create` builder, its `is` guard, and the traversal metadata the registry
 * collects into the visitor tables.
 */
type NodeDef<TNode extends BaseNode = BaseNode, TInput = never> = {
  /**
   * Node discriminator this definition owns.
   */
  kind: NodeKind;
  /**
   * Builds a node from its input, applying `defaults` and the optional `build` hook.
   */
  create: (input: TInput) => TNode;
  /**
   * Type guard matching this node kind.
   */
  is: (node: unknown) => node is TNode;
  /**
   * Child node fields in traversal order. Feeds `VISITOR_KEYS`.
   */
  children?: ReadonlyArray<string>;
  /**
   * Visitor callback name. Feeds `VISITOR_KEY_BY_KIND`.
   */
  visitorKey?: VisitorKey;
};
type DefineNodeConfig<TNode extends BaseNode, TInput, TBuilt extends object> = {
  kind: TNode['kind'];
  defaults?: Partial<TNode>;
  build?: (input: TInput) => TBuilt;
  children?: ReadonlyArray<string>;
  visitorKey?: VisitorKey;
};
/**
 * Defines a node once and derives its `create` builder, `is` guard, and traversal
 * metadata. `create` merges `defaults`, the `build` hook (or the raw input), and the
 * `kind`, so node construction lives in one place without scattered `as` casts.
 *
 * @example Simple node
 * ```ts
 * const importDef = defineNode<ImportNode>({ kind: 'Import' })
 * const createImport = importDef.create
 * ```
 *
 * @example Node with a build hook
 * ```ts
 * const propertyDef = defineNode<PropertyNode, UserPropertyNode>({
 *   kind: 'Property',
 *   build: (props) => ({ ...props, required: props.required ?? false }),
 *   children: ['schema'],
 *   visitorKey: 'property',
 * })
 * ```
 */
declare function defineNode<TNode extends BaseNode, TInput = Omit<TNode, 'kind'>, TBuilt extends object = Omit<TNode, 'kind'>>(config: DefineNodeConfig<TNode, TInput, TBuilt>): NodeDef<TNode, TInput>;
//#endregion
//#region src/nodes/code.d.ts
/**
 * JSDoc documentation metadata attached to code declarations.
 */
type JSDocNode = {
  /**
   * JSDoc comment lines. `undefined` entries are filtered out during rendering.
   *
   * @example
   * ```ts
   * ['@description A pet resource', '@deprecated']
   * ```
   */
  comments?: Array<string | undefined>;
};
/**
 * AST node representing a TypeScript `const` declaration.
 *
 * Mirrors the props of the `Const` component from `@kubb/renderer-jsx`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createConst({ name: 'pet', export: true, asConst: true })
 * // export const pet = ... as const
 * ```
 */
type ConstNode = BaseNode & {
  kind: 'Const';
  /**
   * Name of the constant declaration.
   */
  name: string;
  /**
   * Whether the declaration should be exported.
   */
  export?: boolean | null;
  /**
   * Explicit type annotation.
   *
   * @example Type reference
   * `'Pet'`
   */
  type?: string | null;
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null;
  /**
   * Whether to append `as const` to the declaration.
   */
  asConst?: boolean | null;
  /**
   * Child nodes representing the value of the constant (children of the `Const` component).
   * Each entry is a {@link CodeNode}. Use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>;
};
/**
 * AST node representing a TypeScript `type` alias declaration.
 *
 * Mirrors the props of the `Type` component from `@kubb/renderer-jsx`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createType({ name: 'Pet', export: true })
 * // export type Pet = ...
 * ```
 */
type TypeNode = BaseNode & {
  kind: 'Type';
  /**
   * Name of the type alias.
   */
  name: string;
  /**
   * Whether the declaration should be exported.
   */
  export?: boolean | null;
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null;
  /**
   * Child nodes representing the type body (children of the `Type` component).
   * Each entry is a {@link CodeNode}. Use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>;
};
/**
 * AST node representing a TypeScript `function` declaration.
 *
 * Mirrors the props of the `Function` component from `@kubb/renderer-jsx`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createFunction({ name: 'getPet', export: true, async: true, returnType: 'Pet' })
 * // export async function getPet(): Promise<Pet> { ... }
 * ```
 */
type FunctionNode = BaseNode & {
  kind: 'Function';
  /**
   * Name of the function.
   */
  name: string;
  /**
   * Whether the function is a default export.
   */
  default?: boolean | null;
  /**
   * Function parameter list as a pre-rendered string, written verbatim between the parentheses.
   *
   * @example
   * `'id: string, config: Config = {}'`
   */
  params?: string | null;
  /**
   * Whether the function should be exported.
   */
  export?: boolean | null;
  /**
   * Whether the function is async. When `true`, the return type is wrapped in `Promise<>`.
   */
  async?: boolean | null;
  /**
   * TypeScript generic type parameters.
   *
   * @example Constrained generics
   * `['T', 'U extends string']`
   */
  generics?: string | Array<string> | null;
  /**
   * Return type annotation.
   *
   * @example Type reference
   * `'Pet'`
   */
  returnType?: string | null;
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null;
  /**
   * Child nodes representing the function body (children of the `Function` component).
   * Each entry is a {@link CodeNode}. Use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>;
};
/**
 * AST node representing a TypeScript arrow function (`const name = () => { ... }`).
 *
 * Mirrors the props of the `Function.Arrow` component from `@kubb/renderer-jsx`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createArrowFunction({ name: 'getPet', export: true, singleLine: true })
 * // export const getPet = () => ...
 * ```
 */
type ArrowFunctionNode = Omit<FunctionNode, 'kind'> & {
  kind: 'ArrowFunction';
  /**
   * Render the arrow function body as a single-line expression.
   */
  singleLine?: boolean | null;
};
/**
 * AST node representing a raw text/string fragment in the source output.
 *
 * Used instead of bare `string` values so that all entries in `nodes` arrays
 * are typed `CodeNode` objects rather than a mixed `CodeNode | string` union.
 *
 * @example
 * ```ts
 * createText('return fetch(id)')
 * // { kind: 'Text', value: 'return fetch(id)' }
 * ```
 */
type TextNode = BaseNode & {
  kind: 'Text';
  /**
   * The raw string content.
   */
  value: string;
};
/**
 * AST node representing a blank line in the source output.
 *
 * Corresponds to `<br/>` in JSX components. `printNodes` turns a `Break` between two
 * statements into one blank line. Consecutive breaks, and breaks at the start or end of
 * the list, are folded away, so a `Break` never produces more than one blank line.
 *
 * @example
 * ```ts
 * createBreak()
 * // { kind: 'Break' }
 * ```
 */
type BreakNode = BaseNode & {
  kind: 'Break';
};
/**
 * AST node representing a raw JSX fragment in the source output.
 *
 * Mirrors the `Jsx` component from `@kubb/renderer-jsx`. Embeds raw JSX/TSX markup
 * (including fragments `<>…</>`) directly in generated code.
 *
 * @example
 * ```ts
 * createJsx('<>\n  <a href={href}>Open</a>\n</>')
 * // { kind: 'Jsx', value: '<>\n  <a href={href}>Open</a>\n</>' }
 * ```
 */
type JsxNode = BaseNode & {
  kind: 'Jsx';
  /**
   * The raw JSX string content.
   */
  value: string;
};
/**
 * Union of all code-generation AST nodes.
 *
 * These nodes mirror the JSX components from `@kubb/renderer-jsx` and are used as
 * structured children in {@link SourceNode.nodes}.
 */
type CodeNode = ConstNode | TypeNode | FunctionNode | ArrowFunctionNode | TextNode | BreakNode | JsxNode;
/**
 * Definition for the {@link ConstNode}.
 */
declare const constDef: NodeDef<ConstNode, Omit<ConstNode, "kind">>;
/**
 * Definition for the {@link TypeNode}.
 */
declare const typeDef: NodeDef<TypeNode, Omit<TypeNode, "kind">>;
/**
 * Definition for the {@link FunctionNode}.
 */
declare const functionDef: NodeDef<FunctionNode, Omit<FunctionNode, "kind">>;
/**
 * Definition for the {@link ArrowFunctionNode}.
 */
declare const arrowFunctionDef: NodeDef<ArrowFunctionNode, Omit<ArrowFunctionNode, "kind">>;
/**
 * Definition for the {@link TextNode}.
 */
declare const textDef: NodeDef<TextNode, string>;
/**
 * Definition for the {@link BreakNode}.
 */
declare const breakDef: NodeDef<BreakNode, void>;
/**
 * Definition for the {@link JsxNode}.
 */
declare const jsxDef: NodeDef<JsxNode, string>;
/**
 * Creates a `ConstNode` representing a TypeScript `const` declaration.
 *
 * @example Exported constant with type and `as const`
 * ```ts
 * createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true })
 * // export const pets: Pet[] = ... as const
 * ```
 */
declare const createConst: (input: Omit<ConstNode, "kind">) => ConstNode;
/**
 * Creates a `TypeNode` representing a TypeScript `type` alias declaration.
 *
 * @example
 * ```ts
 * createType({ name: 'Pet', export: true })
 * // export type Pet = ...
 * ```
 */
declare const createType: (input: Omit<TypeNode, "kind">) => TypeNode;
/**
 * Creates a `FunctionNode` representing a TypeScript `function` declaration.
 *
 * @example
 * ```ts
 * createFunction({ name: 'fetchPet', export: true, async: true, returnType: 'Pet' })
 * // export async function fetchPet(): Promise<Pet> { ... }
 * ```
 */
declare const createFunction: (input: Omit<FunctionNode, "kind">) => FunctionNode;
/**
 * Creates an `ArrowFunctionNode` representing a TypeScript arrow function.
 *
 * @example
 * ```ts
 * createArrowFunction({ name: 'double', export: true, params: 'n: number', singleLine: true })
 * // export const double = (n: number) => ...
 * ```
 */
declare const createArrowFunction: (input: Omit<ArrowFunctionNode, "kind">) => ArrowFunctionNode;
/**
 * Creates a {@link TextNode} representing a raw string fragment in the source output.
 *
 * @example
 * ```ts
 * createText('return fetch(id)')
 * // { kind: 'Text', value: 'return fetch(id)' }
 * ```
 */
declare const createText: (input: string) => TextNode;
/**
 * Creates a {@link BreakNode} representing a line break in the source output.
 *
 * @example
 * ```ts
 * createBreak()
 * // { kind: 'Break' }
 * ```
 */
declare function createBreak(): BreakNode;
/**
 * Creates a {@link JsxNode} representing a raw JSX fragment in the source output.
 *
 * @example
 * ```ts
 * createJsx('<>\n  <a href={href}>Open</a>\n</>')
 * // { kind: 'Jsx', value: '<>\n  <a href={href}>Open</a>\n</>' }
 * ```
 */
declare const createJsx: (input: string) => JsxNode;
//#endregion
//#region src/infer.d.ts
/**
 * Options that control how the adapter parser maps source schemas to AST nodes.
 */
type ParserOptions = {
  /**
   * How `format: 'date-time'` schemas are represented downstream.
   * - `false` falls through to a plain `string` (no validation).
   * - `'string'` emits a datetime string node.
   * - `'stringOffset'` emits a datetime node with timezone offset.
   * - `'stringLocal'` emits a local datetime node.
   * - `'date'` emits a `date` node (JavaScript `Date` object).
   */
  dateType: false | 'string' | 'stringOffset' | 'stringLocal' | 'date';
  /**
   * How `type: 'integer'` (and `format: 'int64'`) maps to TypeScript.
   * - `'bigint'` is exact for 64-bit IDs, but does not round-trip through JSON.
   * - `'number'` fits most JSON APIs. Loses precision above `Number.MAX_SAFE_INTEGER`.
   *
   * @default 'bigint'
   */
  integerType?: 'number' | 'bigint';
  /**
   * AST type used when a schema's type cannot be inferred from the spec
   * (`additionalProperties: true`, missing `type`, ...).
   */
  unknownType: 'any' | 'unknown' | 'void';
  /**
   * AST type used for completely empty schemas (`{}`).
   */
  emptySchemaType: 'any' | 'unknown' | 'void';
  /**
   * Suffix appended to derived enum names when Kubb has to invent one
   * (typically for inline enums on object properties).
   */
  enumSuffix: 'enum' | (string & {});
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
type ResolveDateTimeNode<TDateType extends ParserOptions['dateType']> = DateTimeNodeByDateType[TDateType extends keyof DateTimeNodeByDateType ? TDateType : 'string'];
/**
 * Ordered list of `[schema-shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the first matching node type.
 */
type SchemaNodeMap<TDateType extends ParserOptions['dateType'] = 'string'> = [[{
  $ref: string;
}, RefSchemaNode], [{
  allOf: ReadonlyArray<unknown>;
  properties: object;
}, IntersectionSchemaNode], [{
  allOf: readonly [unknown, unknown, ...Array<unknown>];
}, IntersectionSchemaNode], [{
  allOf: ReadonlyArray<unknown>;
}, SchemaNode], [{
  oneOf: ReadonlyArray<unknown>;
}, UnionSchemaNode], [{
  anyOf: ReadonlyArray<unknown>;
}, UnionSchemaNode], [{
  const: null;
}, ScalarSchemaNode], [{
  const: string | number | boolean;
}, EnumSchemaNode], [{
  type: ReadonlyArray<string>;
}, UnionSchemaNode], [{
  type: 'array';
  enum: ReadonlyArray<unknown>;
}, ArraySchemaNode], [{
  enum: ReadonlyArray<unknown>;
}, EnumSchemaNode], [{
  type: 'enum';
}, EnumSchemaNode], [{
  type: 'union';
}, UnionSchemaNode], [{
  type: 'intersection';
}, IntersectionSchemaNode], [{
  type: 'tuple';
}, ArraySchemaNode], [{
  type: 'ref';
}, RefSchemaNode], [{
  type: 'datetime';
}, DatetimeSchemaNode], [{
  type: 'date';
}, DateSchemaNode], [{
  type: 'time';
}, TimeSchemaNode], [{
  type: 'url';
}, UrlSchemaNode], [{
  type: 'object';
}, ObjectSchemaNode], [{
  additionalProperties: boolean | {};
}, ObjectSchemaNode], [{
  type: 'array';
}, ArraySchemaNode], [{
  items: object;
}, ArraySchemaNode], [{
  prefixItems: ReadonlyArray<unknown>;
}, ArraySchemaNode], [{
  type: string;
  format: 'date-time';
}, ResolveDateTimeNode<TDateType>], [{
  type: string;
  format: 'date';
}, DateSchemaNode], [{
  type: string;
  format: 'time';
}, TimeSchemaNode], [{
  format: 'date-time';
}, ResolveDateTimeNode<TDateType>], [{
  format: 'date';
}, DateSchemaNode], [{
  format: 'time';
}, TimeSchemaNode], [{
  type: 'string';
}, StringSchemaNode], [{
  type: 'number';
}, NumberSchemaNode], [{
  type: 'integer';
}, NumberSchemaNode], [{
  type: 'bigint';
}, NumberSchemaNode], [{
  type: string;
}, ScalarSchemaNode], [{
  minLength: number;
}, StringSchemaNode], [{
  maxLength: number;
}, StringSchemaNode], [{
  pattern: string;
}, StringSchemaNode], [{
  minimum: number;
}, NumberSchemaNode], [{
  maximum: number;
}, NumberSchemaNode]];
/**
 * Infers the matching AST `SchemaNode` type from an input schema shape.
 */
type InferSchemaNode<TSchema extends object, TDateType extends ParserOptions['dateType'] = 'string', TEntries extends ReadonlyArray<[object, SchemaNode]> = SchemaNodeMap<TDateType>> = TEntries extends [infer TEntry extends [object, SchemaNode], ...infer TRest extends ReadonlyArray<[object, SchemaNode]>] ? TSchema extends TEntry[0] ? TEntry[1] : InferSchemaNode<TSchema, TDateType, TRest> : SchemaNode;
//#endregion
//#region src/nodes/property.d.ts
/**
 * AST node representing one named object property.
 *
 * @example
 * ```ts
 * const property: PropertyNode = {
 *   kind: 'Property',
 *   name: 'id',
 *   schema: createSchema({ type: 'integer' }),
 *   required: true,
 * }
 * ```
 */
type PropertyNode = BaseNode & {
  kind: 'Property';
  /**
   * Property key.
   */
  name: string;
  /**
   * Property schema.
   */
  schema: SchemaNode;
  /**
   * Whether the property is required.
   */
  required: boolean;
};
/**
 * Loosely-typed property accepted by `createProperty`, with `required` optional.
 */
type UserPropertyNode = Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>;
/**
 * Definition for the {@link PropertyNode}. `required` defaults to `false`, and the schema's
 * `optional`/`nullish` flags are derived from it through {@link optionality}.
 */
declare const propertyDef: NodeDef<PropertyNode, UserPropertyNode>;
/**
 * Creates a `PropertyNode`.
 *
 * @example
 * ```ts
 * const property = createProperty({
 *   name: 'status',
 *   required: true,
 *   schema: createSchema({ type: 'string', nullable: true }),
 * })
 * // required=true, no optional/nullish
 * ```
 */
declare const createProperty: (input: UserPropertyNode) => PropertyNode;
//#endregion
//#region src/nodes/schema.d.ts
type PrimitiveSchemaType =
/**
 * Text value.
 */
'string' |
/**
 * Floating-point number.
 */
'number' |
/**
 * Integer number.
 */
'integer' |
/**
 * Big integer number.
 */
'bigint' |
/**
 * Boolean value.
 */
'boolean' |
/**
 * Null value.
 */
'null' |
/**
 * Any value.
 */
'any' |
/**
 * Unknown value.
 */
'unknown' |
/**
 * No value (`void`).
 */
'void' |
/**
 * Never value.
 */
'never' |
/**
 * Object value.
 */
'object' |
/**
 * Array value.
 */
'array' |
/**
 * Date value.
 */
'date';
/**
 * Composite schema types.
 */
type ComplexSchemaType = 'tuple' | 'union' | 'intersection' | 'enum';
/**
 * Schema types that need special handling in generators.
 */
type SpecialSchemaType = 'ref' | 'datetime' | 'time' | 'uuid' | 'email' | 'url' | 'ipv4' | 'ipv6' | 'blob';
/**
 * All schema type strings.
 */
type SchemaType = PrimitiveSchemaType | ComplexSchemaType | SpecialSchemaType;
/**
 * Scalar schema types without extra object/array/ref structure.
 */
type ScalarSchemaType = Exclude<SchemaType, 'object' | 'array' | 'tuple' | 'union' | 'intersection' | 'enum' | 'ref' | 'datetime' | 'date' | 'time' | 'string' | 'number' | 'integer' | 'bigint' | 'url' | 'uuid' | 'email' | 'ipv4' | 'ipv6'>;
/**
 * Fields shared by all schema nodes.
 */
type SchemaNodeBase = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Schema';
  /**
   * Schema name for named definitions (for example, `"Pet"`).
   * Inline schemas omit this field.
   * `null` means Kubb has processed this and determined there is no applicable name.
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
   * Example values from an `examples` array.
   */
  examples?: Array<unknown>;
  /**
   * Base primitive type.
   * For example, this is `'string'` for a `uuid` schema.
   */
  primitive?: PrimitiveSchemaType;
  /**
   * Schema `format` value.
   */
  format?: string;
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
type ObjectSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'object';
  /**
   * Primitive type, always `'object'` for object schemas.
   */
  primitive: 'object';
  /**
   * Ordered object properties.
   */
  properties: Array<PropertyNode>;
  /**
   * Additional object properties behavior:
   * - `true`: allow any value
   * - `false`: reject unknown properties
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
type ArraySchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator (`array` or `tuple`).
   */
  type: 'array' | 'tuple';
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
type UnionSchemaNode = CompositeSchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'union';
  /**
   * Discriminator property name for a polymorphic union.
   */
  discriminatorPropertyName?: string;
  /**
   * How many union members must be valid.
   * - `'one'`: exactly one member, from `oneOf`
   * - `'any'`: any number of members, from `anyOf`
   */
  strategy?: 'one' | 'any';
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
type IntersectionSchemaNode = CompositeSchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'intersection';
};
/**
 * One named enum item.
 */
type EnumValueNode = {
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
  primitive: Extract<PrimitiveSchemaType, 'string' | 'number' | 'boolean'>;
  /**
   * Label for the enum item, taken from the `x-enumDescriptions` or
   * `x-enum-descriptions` vendor extension. `@kubb/plugin-ts` renders it as
   * JSDoc on the matching enum member.
   */
  description?: string;
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
type EnumSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'enum';
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
type RefSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'ref';
  /**
   * Referenced schema name.
   * `null` means Kubb has processed this and determined there is no applicable name.
   */
  name?: string | null;
  /**
   * Original `$ref` path, for example, `#/components/schemas/Order`.
   * Used to resolve names later.
   */
  ref?: string;
  /**
   * Emitted name of the referenced schema when it differs from the pointer's last segment,
   * for example after a collision rename (`Order` becomes `OrderSchema`) or a macro rename.
   * Resolve display and import names through `resolveRefName`, which prefers this field and
   * falls back to the pointer segment, then `name`.
   */
  targetName?: string;
  /**
   * Pattern copied from a sibling `pattern` field.
   */
  pattern?: string;
  /**
   * The fully-parsed schema this ref resolves to, so its structure (`primitive`, `properties`)
   * can be read without following the reference. Populated during parsing when the
   * definition resolves, `null` when it can't or the ref is circular, and `undefined` when
   * resolution has not been attempted.
   */
  schema?: SchemaNode | null;
};
/**
 * Datetime schema.
 *
 * @example
 * ```ts
 * const datetimeSchema: DatetimeSchemaNode = { kind: 'Schema', type: 'datetime' }
 * ```
 */
type DatetimeSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'datetime';
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
type TemporalSchemaNodeBase<T extends 'date' | 'time'> = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: T;
  /**
   * Output representation in generated code.
   */
  representation: 'date' | 'string';
};
/**
 * Date schema node.
 *
 * @example
 * ```ts
 * const dateSchema: DateSchemaNode = { kind: 'Schema', type: 'date', representation: 'string' }
 * ```
 */
type DateSchemaNode = TemporalSchemaNodeBase<'date'>;
/**
 * Time schema node.
 *
 * @example
 * ```ts
 * const timeSchema: TimeSchemaNode = { kind: 'Schema', type: 'time', representation: 'string' }
 * ```
 */
type TimeSchemaNode = TemporalSchemaNodeBase<'time'>;
/**
 * String schema node.
 *
 * @example
 * ```ts
 * const stringSchema: StringSchemaNode = { kind: 'Schema', type: 'string' }
 * ```
 */
type StringSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'string';
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
type NumberSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'number' | 'integer' | 'bigint';
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
type ScalarSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: ScalarSchemaType;
};
/**
 * URL schema node.
 * Can include a path template for template literal types.
 *
 * @example
 * ```ts
 * const urlSchema: UrlSchemaNode = { kind: 'Schema', type: 'url', path: '/pets/{petId}' }
 * ```
 */
type UrlSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'url';
  /**
   * Path template, for example, `'/pets/{petId}'`.
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
type FormatStringSchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'uuid' | 'email';
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
type Ipv4SchemaNode = SchemaNodeBase & {
  /**
   * Schema type discriminator.
   */
  type: 'ipv4';
};
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
  type: 'ipv6';
};
/**
 * Mapping from schema type literals to concrete schema node types.
 * Used by `narrowSchema`.
 */
type SchemaNodeByType = {
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
type SchemaNode = ObjectSchemaNode | ArraySchemaNode | UnionSchemaNode | IntersectionSchemaNode | EnumSchemaNode | RefSchemaNode | DatetimeSchemaNode | DateSchemaNode | TimeSchemaNode | StringSchemaNode | NumberSchemaNode | UrlSchemaNode | FormatStringSchemaNode | Ipv4SchemaNode | Ipv6SchemaNode | ScalarSchemaNode;
type CreateSchemaObjectInput = Omit<ObjectSchemaNode, 'kind' | 'properties' | 'primitive'> & {
  properties?: Array<PropertyNode>;
  primitive?: 'object';
};
type CreateSchemaInput = CreateSchemaObjectInput | DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>;
type CreateSchemaOutput<T extends CreateSchemaInput> = InferSchemaNode<T> & {
  kind: 'Schema';
};
/**
 * Definition for the {@link SchemaNode}. Object schemas default `properties` to an
 * empty array, and `primitive` is inferred from `type` when not explicitly provided.
 */
declare const schemaDef: NodeDef<SchemaNode, CreateSchemaInput>;
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
declare function createSchema<T extends CreateSchemaInput>(props: T): CreateSchemaOutput<T>;
declare function createSchema(props: CreateSchemaInput): SchemaNode;
//#endregion
//#region src/nodes/content.d.ts
/**
 * AST node representing one content-type entry of a request body or response.
 *
 * There is one entry per content type declared in the spec (e.g. `application/json`,
 * `multipart/form-data`), and each entry holds its own body schema.
 *
 * @example
 * ```ts
 * const content: ContentNode = {
 *   kind: 'Content',
 *   contentType: 'application/json',
 *   schema: createSchema({ type: 'string' }),
 * }
 * ```
 */
type ContentNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Content';
  /**
   * The content type for this entry (e.g. `'application/json'`).
   */
  contentType: string;
  /**
   * Body schema for this content type.
   */
  schema?: SchemaNode;
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Set when a referenced schema has `readOnly`/`writeOnly` fields that should be omitted.
   */
  keysToOmit?: Array<string> | null;
};
/**
 * Definition for the {@link ContentNode}.
 */
declare const contentDef: NodeDef<ContentNode, Omit<ContentNode, "kind">>;
/**
 * Creates a `ContentNode` for a single request-body or response content type.
 */
declare const createContent: (input: Omit<ContentNode, "kind">) => ContentNode;
//#endregion
//#region src/nodes/file.d.ts
/**
 * Supported file extensions.
 */
type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`;
type ImportName = string | Array<string | {
  propertyName: string;
  name?: string;
}>;
/**
 * Represents a language-agnostic import/dependency declaration.
 *
 * @example Named import (TypeScript: `import { useState } from 'react'`)
 * ```ts
 * createImport({ name: ['useState'], path: 'react' })
 * ```
 *
 * @example Default import (TypeScript: `import React from 'react'`)
 * ```ts
 * createImport({ name: 'React', path: 'react' })
 * ```
 *
 * @example Type-only import (TypeScript: `import type { FC } from 'react'`)
 * ```ts
 * createImport({ name: ['FC'], path: 'react', isTypeOnly: true })
 * ```
 *
 * @example Namespace import (TypeScript: `import * as React from 'react'`)
 * ```ts
 * createImport({ name: 'React', path: 'react', isNameSpace: true })
 * ```
 */
type ImportNode = BaseNode & {
  kind: 'Import';
  /**
   * Import name(s) to be used.
   *
   * @example Named imports
   * `['useState']`
   *
   * @example Default import
   * `'React'`
   */
  name: ImportName;
  /**
   * Path for the import.
   *
   * @example
   * `'@kubb/core'`
   */
  path: string;
  /**
   * Add a type-only import prefix.
   * - `true` generates `import type { Type } from './path'`
   * - `false` generates `import { Type } from './path'`
   */
  isTypeOnly?: boolean | null;
  /**
   * Import the entire module as a namespace.
   * - `true` generates `import * as Name from './path'`
   * - `false` generates a standard import
   */
  isNameSpace?: boolean | null;
  /**
   * When set, the import path is resolved relative to this root.
   */
  root?: string | null;
};
/**
 * Represents a language-agnostic export/public API declaration.
 *
 * @example Named export (TypeScript: `export { Pets } from './Pets'`)
 * ```ts
 * createExport({ name: ['Pets'], path: './Pets' })
 * ```
 *
 * @example Type-only export (TypeScript: `export type { Pet } from './Pet'`)
 * ```ts
 * createExport({ name: ['Pet'], path: './Pet', isTypeOnly: true })
 * ```
 *
 * @example Wildcard export (TypeScript: `export * from './utils'`)
 * ```ts
 * createExport({ path: './utils' })
 * ```
 *
 * @example Namespace alias (TypeScript: `export * as utils from './utils'`)
 * ```ts
 * createExport({ name: 'utils', path: './utils', asAlias: true })
 * ```
 */
type ExportNode = BaseNode & {
  kind: 'Export';
  /**
   * Export name(s) to be used. When omitted, generates a wildcard export.
   *
   * @example Named exports
   * `['useState']`
   *
   * @example Single export
   * `'React'`
   */
  name?: string | Array<string> | null;
  /**
   * Path for the export.
   *
   * @example
   * `'@kubb/core'`
   */
  path: string;
  /**
   * Add a type-only export prefix.
   * - `true` generates `export type { Type } from './path'`
   * - `false` generates `export { Type } from './path'`
   */
  isTypeOnly?: boolean | null;
  /**
   * Export as an aliased namespace.
   * - `true` generates `export * as aliasName from './path'`
   * - `false` generates a standard export
   */
  asAlias?: boolean | null;
};
/**
 * Represents a fragment of source code within a file.
 *
 * @example Named exportable source
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true, isIndexable: true })
 * ```
 *
 * @example Inline unnamed code block
 * ```ts
 * createSource({ nodes: [createText('const x = 1')] })
 * ```
 */
type SourceNode = BaseNode & {
  kind: 'Source';
  /**
   * Optional name identifying this source (used for deduplication and barrel generation).
   */
  name?: string | null;
  /**
   * Mark this source as a type-only export.
   */
  isTypeOnly?: boolean | null;
  /**
   * Include the `export` keyword in the generated source.
   */
  isExportable?: boolean | null;
  /**
   * Include this source in barrel/index file generation.
   */
  isIndexable?: boolean | null;
  /**
   * Child nodes that make up this source fragment, in DOM order.
   * Use a {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>;
};
/**
 * Represents a fully resolved file in the AST.
 *
 * Created via `createFile()`, which computes the `id`, `name`, and `extname` from the input
 * and deduplicates `imports`, `exports`, and `sources`.
 *
 * @example
 * ```ts
 * const file = createFile({
 *   baseName: 'petStore.ts',
 *   path: 'src/models/petStore.ts',
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true })],
 *   imports: [createImport({ name: ['z'], path: 'zod' })],
 *   exports: [createExport({ name: ['Pet'], path: './petStore' })],
 * })
 * // file.id   = SHA256 hash of the path
 * // file.name = 'petStore'
 * // file.extname = '.ts'
 * ```
 */
type FileNode<TMeta extends object = object> = BaseNode & {
  kind: 'File';
  /**
   * Unique identifier derived from a SHA256 hash of the file path. `createFile`
   * computes it, so callers do not need to provide it.
   */
  id: string;
  /**
   * File name without extension, derived from `baseName`.
   *
   * @see https://nodejs.org/api/path.html#pathformatpathobject
   */
  name: string;
  /**
   * File base name, including extension, shaped like `${name}${extname}`.
   *
   * @see https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: `${string}.${string}`;
  /**
   * Full qualified path to the file.
   */
  path: string;
  /**
   * File extension extracted from `baseName`.
   */
  extname: Extname;
  /**
   * Deduplicated list of source code fragments.
   */
  sources: Array<SourceNode>;
  /**
   * Deduplicated list of import declarations.
   */
  imports: Array<ImportNode>;
  /**
   * Deduplicated list of export declarations.
   */
  exports: Array<ExportNode>;
  /**
   * Optional metadata attached to this file, read by plugins during barrel generation.
   */
  meta?: TMeta;
  /**
   * Optional banner prepended to the generated file content.
   * Accepts `null` so `resolver.default.banner()` results can be passed directly.
   */
  banner?: string | null;
  /**
   * Optional footer appended to the generated file content.
   * Accepts `null` so `resolver.default.footer()` results can be passed directly.
   */
  footer?: string | null;
  /**
   * Absolute on-disk path to copy verbatim into the output, bypassing the parser.
   *
   * Use to emit a real source file shipped inside a package (a template) into the generated
   * folder without reformatting or import reordering. Only `banner` and `footer` are applied
   * around the copied content. When set, `copy` provides the file content and any `sources`
   * nodes are ignored for output; `sources` may still carry `name`/`isExportable`/`isIndexable`
   * so barrel generation treats the file the same as a rendered one.
   */
  copy?: string | null;
};
/**
 * Definition for the {@link ImportNode}.
 */
declare const importDef: NodeDef<ImportNode, Omit<ImportNode, "kind">>;
/**
 * Definition for the {@link ExportNode}.
 */
declare const exportDef: NodeDef<ExportNode, Omit<ExportNode, "kind">>;
/**
 * Definition for the {@link SourceNode}.
 */
declare const sourceDef: NodeDef<SourceNode, Omit<SourceNode, "kind">>;
/**
 * Definition for the {@link FileNode}. The fully resolved builder lives in
 * `createFile`, so this definition only supplies the guard.
 */
declare const fileDef: NodeDef<FileNode<object>, Omit<FileNode<object>, "kind">>;
/**
 * Creates an `ImportNode` representing a language-agnostic import/dependency declaration.
 *
 * @example Named import
 * ```ts
 * createImport({ name: ['useState'], path: 'react' })
 * // import { useState } from 'react'
 * ```
 */
declare const createImport: (input: Omit<ImportNode, "kind">) => ImportNode;
/**
 * Creates an `ExportNode` representing a language-agnostic export/public API declaration.
 *
 * @example Named export
 * ```ts
 * createExport({ name: ['Pet'], path: './Pet' })
 * // export { Pet } from './Pet'
 * ```
 */
declare const createExport: (input: Omit<ExportNode, "kind">) => ExportNode;
/**
 * Creates a `SourceNode` representing a fragment of source code within a file.
 *
 * @example
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true })
 * ```
 */
declare const createSource: (input: Omit<SourceNode, "kind">) => SourceNode;
/**
 * Input descriptor for {@link createFile}, before `id`, `name`, and `extname` are computed
 * and `imports`/`exports`/`sources` are deduplicated.
 */
type UserFileNode<TMeta extends object = object> = Omit<FileNode<TMeta>, 'kind' | 'id' | 'name' | 'extname' | 'imports' | 'exports' | 'sources'> & Pick<Partial<FileNode<TMeta>>, 'imports' | 'exports' | 'sources'>;
/**
 * Creates a fully resolved `FileNode` from a file input descriptor.
 *
 * Computes:
 * - `id` SHA256 hash of the file path
 * - `name` `baseName` without extension
 * - `extname` extension extracted from `baseName`
 *
 * Deduplicates:
 * - `sources` via `combineSources`
 * - `exports` via `combineExports`
 * - `imports` via `combineImports` (also filters unused imports)
 *
 * @throws {Error} when `baseName` has no extension.
 *
 * @example
 * ```ts
 * const file = createFile({
 *   baseName: 'petStore.ts',
 *   path: 'src/models/petStore.ts',
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')] })],
 *   imports: [createImport({ name: ['z'], path: 'zod' })],
 *   exports: [createExport({ name: ['Pet'], path: './petStore' })],
 * })
 * // file.id      = SHA256 hash of 'src/models/petStore.ts'
 * // file.name    = 'petStore'
 * // file.extname = '.ts'
 * ```
 *
 * @example Copy a real file into the output verbatim
 * ```ts
 * const file = createFile({
 *   baseName: 'client.ts',
 *   path: 'src/gen/client.ts',
 *   copy: '/abs/path/to/templates/client.ts',
 * })
 * ```
 */
declare function createFile<TMeta extends object = object>(input: UserFileNode<TMeta>): FileNode<TMeta>;
//#endregion
//#region src/nodes/parameter.d.ts
type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';
/**
 * Parameter serialization style, controlling how a parameter value is rendered into the request.
 */
type ParameterStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
/**
 * AST node representing one operation parameter.
 *
 * @example
 * ```ts
 * const param: ParameterNode = {
 *   kind: 'Parameter',
 *   name: 'petId',
 *   in: 'path',
 *   schema: createSchema({ type: 'string' }),
 *   required: true,
 * }
 * ```
 */
type ParameterNode = BaseNode & {
  kind: 'Parameter';
  /**
   * Parameter name.
   */
  name: string;
  /**
   * Parameter location (`path`, `query`, `header`, or `cookie`).
   */
  in: ParameterLocation;
  /**
   * Parameter schema.
   */
  schema: SchemaNode;
  /**
   * Whether the parameter is required.
   */
  required: boolean;
  /**
   * Serialization style. Absent when the source omits it, leaving consumers to apply the
   * per-location default.
   */
  style?: ParameterStyle;
  /**
   * Whether array and object values expand into separate values. Absent when the source omits it,
   * leaving consumers to apply the default for the style.
   */
  explode?: boolean;
};
type UserParameterNode = Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>;
/**
 * Definition for the {@link ParameterNode}. `required` defaults to `false`, and the schema's
 * `optional`/`nullish` flags are derived from it through {@link optionality}.
 */
declare const parameterDef: NodeDef<ParameterNode, UserParameterNode>;
/**
 * Creates a `ParameterNode`.
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'petId',
 *   in: 'path',
 *   required: true,
 *   schema: createSchema({ type: 'string' }),
 * })
 * ```
 */
declare const createParameter: (input: UserParameterNode) => ParameterNode;
//#endregion
//#region src/nodes/requestBody.d.ts
/**
 * AST node representing an operation request body.
 *
 * Body schemas live exclusively inside the `content` array (one entry per content type),
 * mirroring {@link ResponseNode}.
 *
 * @example
 * ```ts
 * const requestBody: RequestBodyNode = {
 *   kind: 'RequestBody',
 *   required: true,
 *   content: [{ kind: 'Content', contentType: 'application/json', schema: createSchema({ type: 'string' }) }],
 * }
 * ```
 */
type RequestBodyNode = BaseNode & {
  kind: 'RequestBody';
  /**
   * Request body description carried over from the spec.
   */
  description?: string;
  /**
   * Whether the request body is required (`requestBody.required: true` in the spec).
   * When `false` or absent, the generated `data` parameter should be optional.
   */
  required?: boolean;
  /**
   * Content type entries for this request body.
   *
   * When the adapter `contentType` option is set, this array contains exactly one entry for
   * that content type. Otherwise it contains one entry per content type declared in the spec,
   * so plugins can generate code for every variant (for example, separate hooks for
   * `application/json` and `multipart/form-data`).
   */
  content?: Array<ContentNode>;
};
/**
 * Definition for the {@link RequestBodyNode}. Content entries are built upfront with
 * {@link createContent}, mirroring how `parameters` and `responses` take prebuilt nodes.
 */
declare const requestBodyDef: NodeDef<RequestBodyNode, Omit<RequestBodyNode, "kind">>;
/**
 * Creates a `RequestBodyNode`.
 */
declare const createRequestBody: (input: Omit<RequestBodyNode, "kind">) => RequestBodyNode;
//#endregion
//#region src/nodes/response.d.ts
/**
 * All supported HTTP status code literals as strings, as used in API specs
 * (for example, `"200"` and `"404"`).
 */
type HttpStatusCode = '100' | '101' | '102' | '103' | '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226' | '300' | '301' | '302' | '303' | '304' | '305' | '307' | '308' | '400' | '401' | '402' | '403' | '404' | '405' | '406' | '407' | '408' | '409' | '410' | '411' | '412' | '413' | '414' | '415' | '416' | '417' | '418' | '421' | '422' | '423' | '424' | '425' | '426' | '428' | '429' | '431' | '451' | '500' | '501' | '502' | '503' | '504' | '505' | '506' | '507' | '508' | '510' | '511';
/**
 * Response status code literal used by operations.
 *
 * Includes specific HTTP status code strings and `"default"` for catch-all responses.
 *
 * @example
 * ```ts
 * const status: StatusCode = '200'
 * const fallback: StatusCode = 'default'
 * ```
 */
type StatusCode = HttpStatusCode | 'default';
/**
 * AST node representing one operation response variant.
 *
 * Mirrors {@link OperationNode.requestBody}: the response body schemas live exclusively inside
 * the `content` array (one entry per content type), so the same schema is never duplicated at the
 * node root and inside `content`.
 *
 * @example
 * ```ts
 * const response: ResponseNode = {
 *   kind: 'Response',
 *   statusCode: '200',
 *   content: [{ kind: 'Content', contentType: 'application/json', schema: createSchema({ type: 'string' }) }],
 * }
 * ```
 */
type ResponseNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Response';
  /**
   * HTTP status code or `'default'` for a fallback response.
   */
  statusCode: StatusCode;
  /**
   * Optional response description.
   */
  description?: string;
  /**
   * All available content type entries for this response.
   *
   * When the adapter `contentType` option is set, this array contains exactly one entry for that
   * content type. Otherwise it contains one entry per content type declared in the spec, so that
   * plugins can generate a union of response types (e.g. `application/json` and `application/xml`).
   * Body-less responses keep a single entry whose `schema` is the empty/`void` placeholder.
   *
   * @example
   * ```ts
   * // spec response declares both application/json and application/xml
   * response.content[0].contentType // 'application/json'
   * response.content[1].contentType // 'application/xml'
   * ```
   */
  content?: Array<ContentNode>;
};
type ResponseInput = Pick<ResponseNode, 'statusCode'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'content'>> & {
  content?: Array<ContentNode>;
  schema?: SchemaNode;
  mediaType?: string | null;
  keysToOmit?: Array<string> | null;
};
/**
 * Definition for the {@link ResponseNode}. A single legacy `schema` (with optional
 * `mediaType`/`keysToOmit`) is normalized into one `content` entry.
 */
declare const responseDef: NodeDef<ResponseNode, ResponseInput>;
/**
 * Creates a `ResponseNode`.
 *
 * @example
 * ```ts
 * const response = createResponse({
 *   statusCode: '200',
 *   content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object', properties: [] }) })],
 * })
 * ```
 */
declare const createResponse: (input: ResponseInput) => ResponseNode;
//#endregion
//#region src/nodes/operation.d.ts
/**
 * HTTP method an operation responds to.
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
/**
 * Transport an operation belongs to.
 */
type OperationProtocol = 'http';
/**
 * Fields shared by every operation, regardless of transport.
 */
type OperationNodeBase = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Operation';
  /**
   * Stable identifier for the operation.
   */
  operationId: string;
  /**
   * Group labels for the operation.
   */
  tags: Array<string>;
  /**
   * Short one-line operation summary.
   */
  summary?: string;
  /**
   * Full operation description.
   */
  description?: string;
  /**
   * Marks the operation as deprecated.
   */
  deprecated?: boolean;
  /**
   * Query, path, header, and cookie parameters for the operation.
   */
  parameters: Array<ParameterNode>;
  /**
   * Request body for the operation.
   */
  requestBody?: RequestBodyNode;
  /**
   * Operation responses.
   */
  responses: Array<ResponseNode>;
};
/**
 * Operation served over HTTP. `method` and `path` are guaranteed.
 *
 * @example
 * ```ts
 * const operation: HttpOperationNode = {
 *   kind: 'Operation',
 *   operationId: 'listPets',
 *   protocol: 'http',
 *   method: 'GET',
 *   path: '/pets',
 *   tags: [],
 *   parameters: [],
 *   responses: [],
 * }
 * ```
 */
type HttpOperationNode = OperationNodeBase & {
  /**
   * Transport the operation belongs to.
   */
  protocol?: 'http';
  /**
   * HTTP method like `'GET'`.
   */
  method: HttpMethod;
  /**
   * Path string, for example `/pets/{petId}`, with `{param}` notation preserved.
   */
  path: string;
};
/**
 * Operation for a non-HTTP transport. HTTP-only fields are forbidden.
 */
type GenericOperationNode = OperationNodeBase & {
  /**
   * Transport the operation belongs to.
   */
  protocol?: Exclude<OperationProtocol, 'http'>;
  method?: never;
  path?: never;
};
/**
 * AST node representing one API operation.
 *
 * Discriminated on `protocol`: an {@link HttpOperationNode} (`protocol: 'http'`) guarantees
 * `method` and `path`, while a {@link GenericOperationNode} omits them. Narrow with
 * `isHttpOperationNode(node)` or `node.protocol === 'http'` before reading `method`/`path`.
 */
type OperationNode = HttpOperationNode | GenericOperationNode;
type OperationInput = {
  operationId: string;
  method?: HttpOperationNode['method'];
  path?: HttpOperationNode['path'];
  requestBody?: Omit<RequestBodyNode, 'kind'>;
  [key: string]: unknown;
};
/**
 * Definition for the {@link OperationNode}. HTTP operations (those carrying both
 * `method` and `path`) are tagged with `protocol: 'http'`, and the request body is
 * normalized into a `RequestBodyNode`.
 */
declare const operationDef: NodeDef<OperationNode, OperationInput>;
/**
 * Creates an `OperationNode` with default empty arrays for `tags`, `parameters`, and `responses`.
 *
 * @example
 * ```ts
 * const operation = createOperation({ operationId: 'getPetById', method: 'GET', path: '/pet/{petId}' })
 * // tags, parameters, and responses are []
 * ```
 */
declare function createOperation(props: Pick<HttpOperationNode, 'operationId' | 'method' | 'path'> & Partial<Omit<HttpOperationNode, 'kind' | 'operationId' | 'method' | 'path' | 'requestBody'>> & {
  requestBody?: Omit<RequestBodyNode, 'kind'>;
}): HttpOperationNode;
declare function createOperation(props: Pick<GenericOperationNode, 'operationId'> & Partial<Omit<GenericOperationNode, 'kind' | 'operationId' | 'requestBody'>> & {
  requestBody?: Omit<RequestBodyNode, 'kind'>;
}): GenericOperationNode;
//#endregion
//#region src/nodes/input.d.ts
/**
 * Metadata for an API document, populated by the adapter and available to every generator.
 *
 * All fields are plain JSON-serializable values, no `Set`, no `Map`, no class instances.
 * Computed fields (`circularNames`, `enumNames`) are pre-calculated once during the adapter
 * pre-scan so generators never need to iterate the full schema list themselves.
 *
 * @example
 * ```ts
 * const meta: InputMeta = { title: 'Pet Store', version: '1.0.0', baseURL: 'https://api.example.com/v2', circularNames: [], enumNames: [] }
 * ```
 */
type InputMeta = {
  /**
   * API title from `info.title` in the source document.
   */
  title?: string;
  /**
   * API description from `info.description` in the source document.
   */
  description?: string;
  /**
   * API version string from `info.version` in the source document.
   */
  version?: string;
  /**
   * Resolved base URL from the first matching server entry in the source document.
   */
  baseURL?: string | null;
  /**
   * Names of schemas that participate in a circular reference chain.
   * Computed once during the adapter pre-scan, so a generator never has to
   * call `findCircularSchemas` itself.
   *
   * Convert to a `Set` once at the start of a generator, not per-schema,
   * so lookups stay O(1) without repeated allocations.
   *
   * @example Wrap a circular schema in z.lazy()
   * ```ts
   * const circular = new Set(meta.circularNames)
   * if (circular.has(schema.name)) { ... }
   * ```
   */
  circularNames: ReadonlyArray<string>;
  /**
   * Names of schemas whose type is `enum`.
   * Computed once during the adapter pre-scan, so a generator never has to
   * filter the schema list itself.
   *
   * Convert to a `Set` once at the start of a generator when you need repeated
   * membership checks, so each check stays O(1) instead of an array scan.
   *
   * @example Check if a referenced schema is an enum
   * `const enums = new Set(meta.enumNames)`
   * `const isEnum = enums.has(schemaName)`
   */
  enumNames: ReadonlyArray<string>;
};
/**
 * Input AST node that contains all schemas and operations for one API document.
 * Produced by the adapter and consumed by all Kubb plugins.
 *
 * @example
 * ```ts
 * const input: InputNode = {
 *   kind: 'Input',
 *   schemas: [],
 *   operations: [],
 *   meta: { circularNames: [], enumNames: [] },
 * }
 * ```
 */
type InputNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Input';
  /**
   * All schema nodes in the document.
   */
  schemas: Array<SchemaNode>;
  /**
   * All operation nodes in the document.
   */
  operations: Array<OperationNode>;
  /**
   * Document metadata populated by the adapter.
   */
  meta: InputMeta;
};
/**
 * Definition for the {@link InputNode}.
 */
declare const inputDef: NodeDef<InputNode, Partial<Omit<InputNode, "kind">>>;
/**
 * Creates an `InputNode`, defaulting `schemas`/`operations` to empty arrays and `meta` per
 * {@link inputDef}.
 *
 * @example
 * ```ts
 * const input = createInput()
 * // { kind: 'Input', schemas: [], operations: [] }
 * ```
 */
declare function createInput(overrides?: Partial<Omit<InputNode, 'kind'>>): InputNode;
//#endregion
//#region src/nodes/output.d.ts
/**
 * Output AST node that groups all generated file output for one API document.
 *
 * Produced by generators and consumed by the build pipeline to write files.
 *
 * @example
 * ```ts
 * const output: OutputNode = {
 *   kind: 'Output',
 *   files: [],
 * }
 * ```
 */
type OutputNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Output';
  /**
   * Generated file nodes.
   */
  files: Array<FileNode>;
};
/**
 * Definition for the {@link OutputNode}.
 */
declare const outputDef: NodeDef<OutputNode, Partial<Omit<OutputNode, "kind">>>;
/**
 * Creates an `OutputNode` with a stable default for `files`.
 *
 * @example
 * ```ts
 * const output = createOutput()
 * // { kind: 'Output', files: [] }
 * ```
 */
declare function createOutput(overrides?: Partial<Omit<OutputNode, 'kind'>>): OutputNode;
//#endregion
//#region src/nodes/index.d.ts
/**
 * Union of all AST node types.
 *
 * This lets TypeScript narrow types in `switch (node.kind)` blocks.
 *
 * @example
 * ```ts
 * function getKind(node: Node): string {
 *   switch (node.kind) {
 *     case 'Input':
 *       return 'input'
 *     case 'Output':
 *       return 'output'
 *     default:
 *       return 'other'
 *   }
 * }
 * ```
 */
type Node = InputNode | OutputNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode | RequestBodyNode | ContentNode | FileNode | ImportNode | ExportNode | SourceNode | ConstNode | TypeNode | FunctionNode | ArrowFunctionNode | TextNode | BreakNode | JsxNode;
//#endregion
//#region src/visitor.d.ts
/**
 * Ordered mapping of `[NodeType, ParentType]` pairs.
 *
 * `ParentOf` uses this map to find parent types.
 */
type ParentNodeMap = [[InputNode, undefined], [OutputNode, undefined], [OperationNode, InputNode], [RequestBodyNode, OperationNode], [ContentNode, RequestBodyNode | ResponseNode], [SchemaNode, InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode], [PropertyNode, SchemaNode], [ParameterNode, OperationNode], [ResponseNode, OperationNode]];
/**
 * Resolves the parent node type for a given AST node type.
 *
 * Visitor context relies on this so `ctx.parent` is typed for each callback.
 *
 * @example
 * ```ts
 * type InputParent = ParentOf<InputNode>
 * // undefined
 * ```
 *
 * @example
 * ```ts
 * type PropertyParent = ParentOf<PropertyNode>
 * // SchemaNode
 * ```
 *
 * @example
 * ```ts
 * type SchemaParent = ParentOf<SchemaNode>
 * // InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode
 * ```
 */
type ParentOf<T extends Node, TEntries extends ReadonlyArray<[Node, unknown]> = ParentNodeMap> = TEntries extends [infer TEntry extends [Node, unknown], ...infer TRest extends ReadonlyArray<[Node, unknown]>] ? T extends TEntry[0] ? TEntry[1] : ParentOf<T, TRest> : Node;
/**
 * Traversal context passed as the second argument to every visitor callback.
 * `parent` is typed from the current node type.
 *
 * @example
 * ```ts
 * const visitor: Visitor = {
 *   schema(node, { parent }) {
 *     // parent type is narrowed by node kind
 *   },
 * }
 * ```
 */
type VisitorContext<T extends Node = Node> = {
  /**
   * Parent node of the currently visited node.
   * For `InputNode`, this is `undefined`.
   */
  parent?: ParentOf<T>;
};
/**
 * Synchronous visitor consumed by `transform`. Each optional callback runs
 * for the matching node type. Return a new node to replace it, or `undefined`
 * to leave it untouched.
 *
 * Plugins typically expose `transformer` so users can supply a `Visitor` that
 * rewrites the AST before printing.
 *
 * @example Prefix every operationId
 * ```ts
 * const visitor: Visitor = {
 *   operation(node) {
 *     return { ...node, operationId: `api_${node.operationId}` }
 *   },
 * }
 * ```
 *
 * @example Strip schema descriptions
 * ```ts
 * const visitor: Visitor = {
 *   schema(node) {
 *     return { ...node, description: undefined }
 *   },
 * }
 * ```
 */
type Visitor = {
  input?(node: InputNode, context: VisitorContext<InputNode>): undefined | null | InputNode;
  output?(node: OutputNode, context: VisitorContext<OutputNode>): undefined | null | OutputNode;
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): undefined | null | OperationNode;
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): undefined | null | SchemaNode;
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): undefined | null | PropertyNode;
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): undefined | null | ParameterNode;
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): undefined | null | ResponseNode;
};
/**
 * Visitor used by `collect`.
 *
 * @example
 * ```ts
 * const visitor: CollectVisitor<string> = {
 *   operation(node) {
 *     return node.operationId
 *   },
 * }
 * ```
 */
type CollectVisitor<T> = {
  input?(node: InputNode, context: VisitorContext<InputNode>): T | null | undefined;
  output?(node: OutputNode, context: VisitorContext<OutputNode>): T | null | undefined;
  operation?(node: OperationNode, context: VisitorContext<OperationNode>): T | null | undefined;
  schema?(node: SchemaNode, context: VisitorContext<SchemaNode>): T | null | undefined;
  property?(node: PropertyNode, context: VisitorContext<PropertyNode>): T | null | undefined;
  parameter?(node: ParameterNode, context: VisitorContext<ParameterNode>): T | null | undefined;
  response?(node: ResponseNode, context: VisitorContext<ResponseNode>): T | null | undefined;
};
/**
 * Options for `transform`.
 *
 * @example
 * ```ts
 * const options: TransformOptions = { depth: 'deep', schema: (node) => node }
 * ```
 *
 * @example
 * ```ts
 * // Only transform the current node, not nested children
 * const options: TransformOptions = { depth: 'shallow', schema: (node) => node }
 * ```
 */
type TransformOptions = Visitor & {
  /**
   * Traversal depth.
   * @default 'deep'
   */
  depth?: VisitorDepth;
  /**
   * Internal parent override used during recursion.
   */
  parent?: Node;
};
/**
 * Options for `collect`.
 *
 * @example
 * ```ts
 * const options: CollectOptions<string> = { depth: 'shallow', schema: () => undefined }
 * ```
 */
type CollectOptions<T> = CollectVisitor<T> & {
  /**
   * Traversal depth.
   * @default 'deep'
   */
  depth?: VisitorDepth;
  /**
   * Internal parent override used during recursion.
   */
  parent?: Node;
};
/**
 * Synchronous depth-first transform. Each visitor callback can return a
 * replacement node. Returning `undefined` keeps the original.
 *
 * The original tree is never mutated, a new tree is returned. Pass
 * `depth: 'shallow'` to skip recursion into children.
 *
 * @example Prefix every operationId
 * ```ts
 * const next = transform(root, {
 *   operation(node) {
 *     return { ...node, operationId: `prefixed_${node.operationId}` }
 *   },
 * })
 * ```
 *
 * @example Replace only the root node
 * ```ts
 * const next = transform(root, {
 *   depth: 'shallow',
 *   input: (node) => ({ ...node, meta: { ...node.meta, title: 'Rewritten' } }),
 * })
 * ```
 */
declare function transform(node: InputNode, options: TransformOptions): InputNode;
declare function transform(node: OutputNode, options: TransformOptions): OutputNode;
declare function transform(node: OperationNode, options: TransformOptions): OperationNode;
declare function transform(node: SchemaNode, options: TransformOptions): SchemaNode;
declare function transform(node: PropertyNode, options: TransformOptions): PropertyNode;
declare function transform(node: ParameterNode, options: TransformOptions): ParameterNode;
declare function transform(node: ResponseNode, options: TransformOptions): ResponseNode;
declare function transform(node: Node, options: TransformOptions): Node;
/**
 * Lazy depth-first collection pass. Yields every non-null value returned by
 * the visitor callbacks. Use `collectSync` for the eager array form.
 *
 * @example Collect every operationId
 * ```ts
 * const ids: string[] = []
 * for (const id of collect<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })) {
 *   ids.push(id)
 * }
 * ```
 */
declare function collect<T>(node: Node, options: CollectOptions<T>): Generator<T, void, undefined>;
/**
 * Eager depth-first collection pass. Gathers every non-null value the visitor
 * callbacks return into an array.
 *
 * @example Collect every operationId
 * ```ts
 * const ids = collectSync<string>(root, {
 *   operation(node) {
 *     return node.operationId
 *   },
 * })
 * ```
 */
declare function collectSync<T>(node: Node, options: CollectOptions<T>): Array<T>;
//#endregion
//#region src/defineMacro.d.ts
/**
 * Ordering hint shared by macros and plugins. `pre` runs before unmarked items, `post` after,
 * and `undefined` keeps declaration order.
 */
type Enforce = 'pre' | 'post';
/**
 * A named, composable transform over the Kubb AST. It carries the same per-kind callbacks as a
 * {@link Visitor} (`schema`, `operation`, …), plus a `name`, an optional `enforce` order, and an
 * optional `match` predicate. Macros run on the shared AST, so the same macro works across every
 * adapter and output target. Exports follow the `macro<Name>` convention, mirroring plugins (`pluginTs`).
 */
type Macro = Visitor & {
  /**
   * Macro identifier used to tell macros apart, for example `'simplify-union'`.
   */
  name: string;
  /**
   * Ordering hint. `pre` macros run before unmarked macros, `post` macros run after.
   * Ordering within a bucket follows list order.
   */
  enforce?: Enforce;
  /**
   * Predicate checked against the current node before any callback runs. Returning `false`
   * skips the macro for that node.
   */
  match?: (node: Node) => boolean;
};
/**
 * Types a macro for inference and a single construction site, mirroring `definePlugin`.
 * Adds no runtime behavior.
 *
 * @example
 * ```ts
 * const macroUntagged = defineMacro({
 *   name: 'untagged',
 *   operation(node) {
 *     return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
 *   },
 * })
 * ```
 */
declare function defineMacro(macro: Macro): Macro;
/**
 * Folds an ordered list of macros into a single {@link Visitor} that `transform` (and the per-plugin
 * transform layer in `@kubb/core`) can run. Macros are stable-sorted by `enforce`, then applied
 * sequentially per node so later macros see earlier output. This differs from a plain visitor, which
 * has no names, ordering, or composition.
 *
 * @example
 * ```ts
 * const visitor = composeMacros([macroSimplifyUnion, macroDiscriminatorEnum])
 * const next = transform(root, visitor)
 * ```
 */
declare function composeMacros(macros: ReadonlyArray<Macro>): Visitor;
/**
 * Runs a list of macros over a node tree and returns the rewritten tree. Keeps `transform`'s
 * structural sharing, so an empty or no-op macro list returns the same reference. Pass
 * `depth: 'shallow'` to rewrite the root node only.
 *
 * @example
 * ```ts
 * const next = applyMacros(root, [macroIntegerToString])
 * ```
 *
 * @example Apply to the root node only
 * ```ts
 * const named = applyMacros(node, [macroEnumName({ parentName, propName, enumSuffix })], { depth: 'shallow' })
 * ```
 */
declare function applyMacros<TNode extends Node>(root: TNode, macros: ReadonlyArray<Macro>, options?: {
  depth?: VisitorDepth;
}): TNode;
//#endregion
//#region src/createPrinter.d.ts
/**
 * Runtime context passed as `this` to printer handlers.
 *
 * `this.transform` dispatches to node-level handlers from `nodes`.
 *
 * @example
 * ```ts
 * const context: PrinterHandlerContext<string, {}> = {
 *   options: {},
 *   transform: () => 'value',
 *   base: () => 'value',
 * }
 * ```
 */
type PrinterHandlerContext<TOutput, TOptions extends object> = {
  /**
   * Recursively transform a nested `SchemaNode` to `TOutput` using the node-level handlers.
   * Use `this.transform` inside `nodes` handlers and inside the `print` override.
   */
  transform: (node: SchemaNode) => TOutput | null;
  /**
   * Run the printer's built-in handler for the node, ignoring any override for its type.
   * Inside an override, `this.base(node)` returns what the printer would have emitted,
   * so the override can wrap it instead of re-implementing the handler. Nested nodes
   * still dispatch through the overrides.
   */
  base: (node: SchemaNode) => TOutput | null;
  /**
   * Options for this printer instance.
   */
  options: TOptions;
};
/**
 * Handler for one schema node type.
 *
 * Use a regular function (not an arrow function) if you need `this`.
 *
 * @example
 * ```ts
 * const handler: PrinterHandler<string, {}, 'string'> = function () {
 *   return 'string'
 * }
 * ```
 */
type PrinterHandler<TOutput, TOptions extends object, T extends SchemaType = SchemaType> = (this: PrinterHandlerContext<TOutput, TOptions>, node: SchemaNodeByType[T]) => TOutput | null;
/**
 * Partial map of per-node-type handler overrides for a printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`).
 * Supply only the handlers you want to replace. The printer's built-in
 * defaults fill in the rest.
 *
 * @example
 * ```ts
 * pluginZod({
 *   printer: {
 *     nodes: {
 *       date(): string {
 *         return 'z.string().date()'
 *       },
 *     } satisfies PrinterPartial<string, PrinterZodOptions>,
 *   },
 * })
 * ```
 */
type PrinterPartial<TOutput, TOptions extends object> = Partial<{ [K in SchemaType]: PrinterHandler<TOutput, TOptions, K>; }>;
/**
 * Generic shape used by `definePrinter`.
 *
 * - `TName` unique string identifier (e.g. `'zod'`, `'ts'`)
 * - `TOptions` options passed to and stored on the printer instance
 * - `TOutput` the type emitted by node handlers
 * - `TPrintOutput` type returned by public `print` (defaults to `TOutput`)
 *
 * @example
 * ```ts
 * type MyPrinter = PrinterFactoryOptions<'my', { strict: boolean }, string>
 * ```
 */
type PrinterFactoryOptions<TName extends string = string, TOptions extends object = object, TOutput = unknown, TPrintOutput = TOutput> = {
  name: TName;
  options: TOptions;
  output: TOutput;
  printOutput: TPrintOutput;
};
/**
 * Printer instance returned by a printer factory.
 *
 * @example
 * ```ts
 * const printer = definePrinter((options: {}) => ({ name: 'x', options, nodes: {} }))({})
 * ```
 */
type Printer<T extends PrinterFactoryOptions = PrinterFactoryOptions> = {
  /**
   * Unique identifier supplied at creation time.
   */
  name: T['name'];
  /**
   * Options for this printer instance.
   */
  options: T['options'];
  /**
   * Node-level dispatcher, converts a `SchemaNode` directly to `TOutput` using the `nodes` handlers.
   * Always dispatches through the `nodes` map. Never calls the `print` override.
   * Reach for it when you need the raw output (e.g. `ts.TypeNode`) without declaration wrapping.
   */
  transform: (node: SchemaNode) => T['output'] | null;
  /**
   * Public printer. If the builder provides a root-level `print`, this calls that
   * higher-level function (which may produce full declarations).
   * Otherwise, falls back to the node-level dispatcher.
   */
  print: (node: SchemaNode) => T['printOutput'] | null;
};
/**
 * Builder function passed to `definePrinter`.
 *
 * It receives resolved options and returns:
 * - `name`
 * - `options`
 * - `nodes` handlers
 * - optional top-level `print` override
 *
 * @example
 * ```ts
 * const build = (options: {}) => ({ name: 'x' as const, options, nodes: {} })
 * ```
 */
type PrinterBuilder<T extends PrinterFactoryOptions> = (options: T['options']) => {
  name: T['name'];
  /**
   * Options to store on the printer.
   */
  options: T['options'];
  nodes: Partial<{ [K in SchemaType]: PrinterHandler<T['output'], T['options'], K>; }>;
  /**
   * User-supplied handler overrides. An override wins over the matching `nodes` handler,
   * and can call `this.base(node)` to reuse the handler it replaced. Pass overrides here
   * instead of spreading them into `nodes`, otherwise `this.base` cannot find the original.
   */
  overrides?: Partial<{ [K in SchemaType]: PrinterHandler<T['output'], T['options'], K>; }>;
  /**
   * Optional root-level print override. When provided, becomes the public `printer.print`.
   * Use `this.transform(node)` inside this function to dispatch to the node-level handlers (`nodes`),
   * not the override itself, so recursion is safe.
   */
  print?: (this: PrinterHandlerContext<T['output'], T['options']>, node: SchemaNode) => T['printOutput'] | null;
};
/**
 * Creates a schema printer: a function that takes a `SchemaNode` and emits
 * code in your target language. Each plugin that produces code from schemas
 * (TypeScript types, Zod schemas, Faker factories) ships a printer built
 * with this helper.
 *
 * The builder receives resolved options and returns:
 *
 * - `name` unique identifier for the printer.
 * - `options` stored on the returned printer instance.
 * - `nodes` map of `SchemaType` → handler. Handlers return the rendered
 *   output (a string, a TypeScript AST node, ...) for that schema type.
 * - `overrides` (optional), user-supplied handlers that win over `nodes`.
 *   An override can call `this.base(node)` to reuse the handler it replaced.
 * - `print` (optional), top-level override exposed as `printer.print`.
 *   Use `this.transform(node)` inside it to dispatch to `nodes` recursively.
 *
 * Without a `print` override, `printer.print` falls back to `printer.transform`
 * (the node-level dispatcher).
 *
 * @example Tiny Zod printer
 * ```ts
 * import { createPrinter, type PrinterFactoryOptions } from '@kubb/ast'
 *
 * type PrinterZod = PrinterFactoryOptions<'zod', { strict?: boolean }, string>
 *
 * export const zodPrinter = createPrinter<PrinterZod>((options) => ({
 *   name: 'zod',
 *   options: { strict: options.strict ?? true },
 *   nodes: {
 *     string: () => 'z.string()',
 *     object(node) {
 *       const props = node.properties
 *         .map((p) => `${p.name}: ${this.transform(p.schema)}`)
 *         .join(', ')
 *       return `z.object({ ${props} })`
 *     },
 *   },
 * }))
 * ```
 */
declare function createPrinter<T extends PrinterFactoryOptions = PrinterFactoryOptions>(build: PrinterBuilder<T>): (options?: T['options']) => Printer<T>;
//#endregion
export { importDef as $, DistributiveOmit as $t, ResponseNode as A, ArrowFunctionNode as At, createParameter as B, breakDef as Bt, inputDef as C, schemaDef as Ct, OperationNode as D, propertyDef as Dt, HttpOperationNode as E, createProperty as Et, createRequestBody as F, JSDocNode as Ft, SourceNode as G, createFunction as Gt, ExportNode as H, createArrowFunction as Ht, requestBodyDef as I, JsxNode as It, createFile as J, createType as Jt, UserFileNode as K, createJsx as Kt, ParameterLocation as L, TextNode as Lt, createResponse as M, CodeNode as Mt, responseDef as N, ConstNode as Nt, createOperation as O, InferSchemaNode as Ot, RequestBodyNode as P, FunctionNode as Pt, fileDef as Q, typeDef as Qt, ParameterNode as R, TypeNode as Rt, createInput as S, createSchema as St, HttpMethod as T, UserPropertyNode as Tt, FileNode as U, createBreak as Ut, parameterDef as V, constDef as Vt, ImportNode as W, createConst as Wt, createSource as X, jsxDef as Xt, createImport as Y, functionDef as Yt, exportDef as Z, textDef as Zt, OutputNode as _, SchemaType as _t, Enforce as a, DateSchemaNode as at, InputMeta as b, UnionSchemaNode as bt, composeMacros as c, IntersectionSchemaNode as ct, Visitor as d, PrimitiveSchemaType as dt, NodeDef as en, sourceDef as et, VisitorContext as f, RefSchemaNode as ft, Node as g, SchemaNodeByType as gt, transform as h, SchemaNode as ht, createPrinter as i, schemaTypes as in, ArraySchemaNode as it, StatusCode as j, BreakNode as jt, operationDef as k, ParserOptions as kt, defineMacro as l, NumberSchemaNode as lt, collectSync as m, ScalarSchemaType as mt, PrinterFactoryOptions as n, BaseNode as nn, contentDef as nt, Macro as o, DatetimeSchemaNode as ot, collect as p, ScalarSchemaNode as pt, createExport as q, createText as qt, PrinterPartial as r, NodeKind as rn, createContent as rt, applyMacros as s, EnumSchemaNode as st, Printer as t, defineNode as tn, ContentNode as tt, ParentOf as u, ObjectSchemaNode as ut, createOutput as v, StringSchemaNode as vt, GenericOperationNode as w, PropertyNode as wt, InputNode as x, UrlSchemaNode as xt, outputDef as y, TimeSchemaNode as yt, ParameterStyle as z, arrowFunctionDef as zt };
//# sourceMappingURL=types-BPqinVNh.d.ts.map