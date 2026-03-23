import type { SchemaType } from '@kubb/ast/types'
import type { ParserOptions } from './types.ts'

/**
 * Default values for all `Options` fields.
 */
export const DEFAULT_PARSER_OPTIONS = {
  dateType: 'string',
  integerType: 'number',
  unknownType: 'any',
  emptySchemaType: 'any',
  enumSuffix: 'enum',
} as const satisfies ParserOptions

/**
 * OpenAPI version string written into merged document stubs.
 */
export const MERGE_OPENAPI_VERSION = '3.0.0' as const

/**
 * Fallback `info.title` used when merging multiple API documents.
 */
export const MERGE_DEFAULT_TITLE = 'Merged API' as const

/**
 * Fallback `info.version` used when merging multiple API documents.
 */
export const MERGE_DEFAULT_VERSION = '1.0.0' as const

/**
 * JSON Schema keywords that indicate structural composition.
 * A schema fragment containing any of these keys must not be inlined into its
 * parent during `allOf` flattening — it carries semantic meaning of its own.
 */
export const structuralKeys = new Set(['properties', 'items', 'additionalProperties', 'oneOf', 'anyOf', 'allOf', 'not'] as const)

/**
 * Maps OAS/JSON Schema `format` strings to their Kubb `SchemaType` equivalents.
 *
 * Only formats that need a type different from the raw OAS `type` are listed.
 * `int64`, `date-time`, `date`, and `time` are handled separately because their
 * mapping depends on runtime parser options.
 *
 * Note: `ipv4`, `ipv6`, and `hostname` map to `'url'` — the closest supported
 * scalar type in the Kubb AST, even though these are not strictly URLs.
 */
export const formatMap = {
  uuid: 'uuid',
  email: 'email',
  'idn-email': 'email',
  uri: 'url',
  'uri-reference': 'url',
  url: 'url',
  ipv4: 'url',
  ipv6: 'url',
  hostname: 'url',
  'idn-hostname': 'url',
  binary: 'blob',
  byte: 'blob',
  // Numeric formats override the OAS `type` because format is more specific.
  // See https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
  int32: 'integer',
  float: 'number',
  double: 'number',
} as const satisfies Record<string, SchemaType>

/**
 * Vendor extension keys used to attach human-readable labels to enum values.
 * Checked in priority order: the first key found wins.
 */
export const enumExtensionKeys = ['x-enumNames', 'x-enum-varnames'] as const
