import type { ast } from '@kubb/ast'

/**
 * Default parser options applied when no explicit options are provided.
 */
export const DEFAULT_PARSER_OPTIONS = {
  dateType: 'string',
  integerType: 'bigint',
  unknownType: 'any',
  emptySchemaType: 'any',
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
 */
export const SUPPORTED_METHODS: ReadonlySet<string> = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'])

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
 * special-cases in `parser.ts`. `isHandledFormat` reads it so the
 * `KUBB_UNSUPPORTED_FORMAT` diagnostic and the parser agree on what is handled.
 */
export const specialCasedFormats: ReadonlySet<string> = new Set(['int64', 'uint64', 'date-time', 'date', 'time'])

/**
 * Static map from OAS `format` strings to Kubb `SchemaType` values.
 *
 * Only formats whose AST type differs from the OAS `type` field appear here.
 * Formats that depend on runtime options (`int64`, `date-time`, `date`, `time`) are handled
 * separately in the parser. `ipv4` and `ipv6` map to their own dedicated schema types. `hostname`
 * and `idn-hostname` map to `'url'` as the closest generic string-format type.
 */
export const formatMap = {
  uuid: 'uuid',
  email: 'email',
  'idn-email': 'email',
  uri: 'url',
  'uri-reference': 'url',
  url: 'url',
  ipv4: 'ipv4',
  ipv6: 'ipv6',
  hostname: 'url',
  'idn-hostname': 'url',
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
