import type { ast } from '@kubb/kit'

/**
 * Default parser options applied when no explicit options are provided.
 */
export const DEFAULT_PARSER_OPTIONS = {
  dateType: 'string',
  integerType: 'bigint',
  unknownType: 'unknown',
  emptySchemaType: 'unknown',
  enumSuffix: 'enum',
} as const satisfies ast.ParserOptions

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
export const SCHEMA_REF_PREFIX = '#/components/schemas/' as const

/**
 * HTTP methods that count as operations on an OpenAPI path item. Other keys
 * (`parameters`, `summary`, `$ref`, vendor extensions) are skipped when iterating operations.
 * `query` is the OpenAPI 3.2 field for the HTTP QUERY method (RFC 10008).
 */
export const SUPPORTED_METHODS: ReadonlySet<string> = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'query'])

/**
 * Set of JSON Schema keywords that prevent a schema fragment from being inlined during `allOf` flattening.
 *
 * A fragment that contains any of these keys carries structural meaning of its own and must stay as a separate
 * intersection member rather than being merged into the parent.
 */
export const structuralKeys = new Set(['properties', 'items', 'additionalProperties', 'oneOf', 'anyOf', 'allOf', 'not'] as const)

/**
 * Formats `convertFormat` maps to a dedicated type without going through `formatMap`:
 * `int64`, `uint64` and the date/time family. Keep this in sync with the `convertFormat`
 * special-cases in `emit/converters/scalar.ts`. `isHandledFormat` reads it so the
 * `KUBB_UNSUPPORTED_FORMAT` diagnostic and the parser agree on what is handled.
 */
export const specialCasedFormats: ReadonlySet<string> = new Set(['int64', 'uint64', 'date-time', 'date', 'time'])

/**
 * Formats that describe a number, whether they resolve through `formatMap` or through the
 * `convertFormat` special cases. On a `type: 'string'` schema these do not make the value a
 * number: gRPC-gateway and other ProtoJSON producers send 64-bit integers as JSON strings.
 *
 * @see https://protobuf.dev/programming-guides/json/#int64-strings
 */
export const numericFormats: ReadonlySet<string> = new Set(['int32', 'int64', 'uint64', 'float', 'double'])

/**
 * Static map from OAS `format` strings to Kubb `SchemaType` values.
 *
 * Lists formats whose AST type differs from the OAS `type` field, plus string formats that
 * `KUBB_UNSUPPORTED_FORMAT` should not flag.
 * Formats that depend on runtime options (`int64`, `date-time`, `date`, `time`) are handled
 * separately in the parser. `ipv4` and `ipv6` map to their own dedicated schema types.
 * `uri-reference`, `hostname` and `idn-hostname` map to `'string'`: a relative reference or a bare
 * host name is not a URL, so a `'url'` validator would reject valid values.
 */
export const formatMap = {
  uuid: 'uuid',
  email: 'email',
  'idn-email': 'email',
  uri: 'url',
  'uri-reference': 'string',
  url: 'url',
  ipv4: 'ipv4',
  ipv6: 'ipv6',
  hostname: 'string',
  'idn-hostname': 'string',
  binary: 'blob',
  byte: 'blob',
  // Numeric formats override the OAS `type` because format is more specific.
  // See https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
  int32: 'integer',
  float: 'number',
  double: 'number',
} as const satisfies Record<string, ast.SchemaType>

/**
 * Vendor extension keys that attach human-readable labels to enum values, checked in priority order.
 */
export const enumExtensionKeys = ['x-enumNames', 'x-enum-varnames'] as const

/**
 * Vendor extension keys that attach human-readable descriptions to enum values, checked in priority order.
 */
export const enumDescriptionKeys = ['x-enumDescriptions', 'x-enum-descriptions'] as const
