import { ast } from "@kubb/core";

/**
 * Default parser options applied when no explicit options are provided.
 *
 * @example
 * ```ts
 * import { DEFAULT_PARSER_OPTIONS } from '@kubb/adapter-oas'
 *
 * const parser = createOasParser(oas)
 * const root = parser.parse({ ...DEFAULT_PARSER_OPTIONS, dateType: 'date' })
 * ```
 */
export const DEFAULT_PARSER_OPTIONS = {
  dateType: "string",
  integerType: "number",
  unknownType: "any",
  emptySchemaType: "any",
  enumSuffix: "enum",
} as const satisfies ast.ParserOptions;

/**
 * JSON-Pointer prefix for schemas declared under `components.schemas` in an OpenAPI document.
 *
 * Used when building or parsing `$ref` strings.
 *
 * @example
 * ```ts
 * `${SCHEMA_REF_PREFIX}Pet` // '#/components/schemas/Pet'
 * ```
 */
export const SCHEMA_REF_PREFIX = "#/components/schemas/" as const;

/**
 * OpenAPI version string written into the stub document created during multi-spec merges.
 */
export const MERGE_OPENAPI_VERSION = "3.0.0" as const;

/**
 * Fallback `info.title` placed in the stub document when merging multiple API files.
 */
export const MERGE_DEFAULT_TITLE = "Merged API" as const;

/**
 * Fallback `info.version` placed in the stub document when merging multiple API files.
 */
export const MERGE_DEFAULT_VERSION = "1.0.0" as const;

/**
 * Set of JSON Schema keywords that prevent a schema fragment from being inlined during `allOf` flattening.
 *
 * A fragment that contains any of these keys carries structural meaning of its own and must stay as a separate
 * intersection member rather than being merged into the parent.
 *
 * @example
 * ```ts
 * import { structuralKeys } from '@kubb/adapter-oas'
 *
 * const isStructural = Object.keys(fragment).some((key) => structuralKeys.has(key))
 * // true when fragment has e.g. 'properties' or 'oneOf'
 * ```
 */
export const structuralKeys = new Set([
  "properties",
  "items",
  "additionalProperties",
  "oneOf",
  "anyOf",
  "allOf",
  "not",
] as const);

/**
 * Static map from OAS `format` strings to Kubb `SchemaType` values.
 *
 * Only formats whose AST type differs from the OAS `type` field appear here.
 * Formats that depend on runtime options (`int64`, `date-time`, `date`, `time`) are handled separately
 * in the parser. `ipv4` and `ipv6` map to their own dedicated schema types; `hostname` and
 * `idn-hostname` map to `'url'` as the closest generic string-format type.
 *
 * @example
 * ```ts
 * import { formatMap } from '@kubb/adapter-oas'
 *
 * formatMap['uuid']   // 'uuid'
 * formatMap['binary'] // 'blob'
 * formatMap['float']  // 'number'
 * ```
 */
export const formatMap = {
  uuid: "uuid",
  email: "email",
  "idn-email": "email",
  uri: "url",
  "uri-reference": "url",
  url: "url",
  ipv4: "ipv4",
  ipv6: "ipv6",
  hostname: "url",
  "idn-hostname": "url",
  binary: "blob",
  byte: "blob",
  // Numeric formats override the OAS `type` because format is more specific.
  // See https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
  int32: "integer",
  float: "number",
  double: "number",
} as const satisfies Record<string, ast.SchemaType>;

/**
 * Vendor extension keys that attach human-readable labels to enum values, checked in priority order.
 *
 * @example
 * ```ts
 * import { enumExtensionKeys } from '@kubb/adapter-oas'
 *
 * const key = enumExtensionKeys.find((k) => k in schema) // 'x-enumNames' | 'x-enum-varnames' | undefined
 * ```
 */
export const enumExtensionKeys = ["x-enumNames", "x-enum-varnames"] as const;

/**
 * Maps `'any' | 'unknown' | 'void'` option strings to their `ScalarSchemaType` constant.
 * Replaces a plain object lookup with a `Map` for explicit key membership testing via `.has()`.
 */
export const typeOptionMap = new Map<
  "any" | "unknown" | "void",
  ast.ScalarSchemaType
>([
  ["any", ast.schemaTypes.any],
  ["unknown", ast.schemaTypes.unknown],
  ["void", ast.schemaTypes.void],
]);
