import type { NodeKind } from './nodes/base.ts'
import type { MediaType } from './nodes/http.ts'
import type { HttpMethod } from './nodes/operation.ts'
import type { ParameterLocation } from './nodes/parameter.ts'
import type { SchemaType } from './nodes/schema.ts'

/**
 * Traversal depth used by AST visitor utilities.
 */
export type VisitorDepth = 'shallow' | 'deep'

export const visitorDepths = {
  shallow: 'shallow',
  deep: 'deep',
} as const satisfies Record<VisitorDepth, VisitorDepth>

export const nodeKinds = {
  input: 'Input',
  output: 'Output',
  operation: 'Operation',
  schema: 'Schema',
  property: 'Property',
  parameter: 'Parameter',
  response: 'Response',
  functionParameter: 'FunctionParameter',
  parameterGroup: 'ParameterGroup',
  functionParameters: 'FunctionParameters',
} as const satisfies Record<string, NodeKind>

/**
 * Canonical schema type strings used by AST schema nodes.
 *
 * These values are used across the AST as stable discriminators
 * (for example `schema.type === schemaTypes.object`).
 *
 * The map is grouped by intent:
 * - primitives (`string`, `number`, `boolean`, ...)
 * - structural/composite (`object`, `array`, `union`, ...)
 * - special OpenAPI-oriented types (`ref`, `datetime`, `uuid`, ...)
 */
export const schemaTypes = {
  /**
   * Text value.
   */
  string: 'string',
  /**
   * Floating-point number (`float`, `double`).
   */
  number: 'number',
  /**
   * Whole number (`int32`). Use `bigint` for `int64`.
   */
  integer: 'integer',
  /**
   * 64-bit integer (`int64`). Only used when `integerType` is set to `'bigint'`.
   */
  bigint: 'bigint',
  /**
   * Boolean value
   */
  boolean: 'boolean',
  /**
   * Explicit null value.
   */
  null: 'null',
  /**
   * Any value (no type restriction).
   */
  any: 'any',
  /**
   * Unknown value (must be narrowed before usage).
   */
  unknown: 'unknown',
  /**
   * No return value (`void`).
   */
  void: 'void',
  /**
   * Object with named properties.
   */
  object: 'object',
  /**
   * Sequential list of items.
   */
  array: 'array',
  /**
   * Fixed-length list with position-specific items.
   */
  tuple: 'tuple',
  /**
   * "One of" multiple schema members.
   */
  union: 'union',
  /**
   * "All of" multiple schema members.
   */
  intersection: 'intersection',
  /**
   * Enum schema.
   */
  enum: 'enum',
  /**
   * Reference to another schema.
   */
  ref: 'ref',
  /**
   * Calendar date (for example `2026-03-24`).
   */
  date: 'date',
  /**
   * Date-time value (for example `2026-03-24T09:00:00Z`).
   */
  datetime: 'datetime',
  /**
   * Time-only value (for example `09:00:00`).
   */
  time: 'time',
  /**
   * UUID value.
   */
  uuid: 'uuid',
  /**
   * Email address value.
   */
  email: 'email',
  /**
   * URL value.
   */
  url: 'url',
  /**
   * IPv4 address value.
   */
  ipv4: 'ipv4',
  /**
   * IPv6 address value.
   */
  ipv6: 'ipv6',
  /**
   * Binary/blob value.
   */
  blob: 'blob',
  /**
   * Impossible value (`never`).
   */
  never: 'never',
} as const satisfies Record<SchemaType, SchemaType>

export type ScalarPrimitive = 'string' | 'number' | 'integer' | 'bigint' | 'boolean'

/**
 * Primitive scalar schema types used when simplifying union members.
 */
export const SCALAR_PRIMITIVE_TYPES = new Set<ScalarPrimitive>(['string', 'number', 'integer', 'bigint', 'boolean'])

/**
 * Returns `true` when `type` is a scalar primitive schema type.
 */
export function isScalarPrimitive(type: string): type is ScalarPrimitive {
  return SCALAR_PRIMITIVE_TYPES.has(type as ScalarPrimitive)
}

export const httpMethods = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE',
  head: 'HEAD',
  options: 'OPTIONS',
  trace: 'TRACE',
} as const satisfies Record<Lowercase<HttpMethod>, HttpMethod>

export const parameterLocations = {
  path: 'path',
  query: 'query',
  header: 'header',
  cookie: 'cookie',
} as const satisfies Record<ParameterLocation, ParameterLocation>

/**
 * Default maximum number of concurrent callbacks used by `walk`.
 *
 * 30 is chosen to allow enough parallelism to overlap I/O-bound resolver calls
 * without overwhelming the event loop or causing excessive memory pressure during
 * large spec traversals.
 *
 * @example
 * ```ts
 * walk(root, { concurrency: WALK_CONCURRENCY, root: () => {} })
 * ```
 */
export const WALK_CONCURRENCY = 30

/**
 * Fallback response status code used for catch-all responses.
 *
 * @example
 * ```ts
 * const status = DEFAULT_STATUS_CODE // 'default'
 * ```
 */
export const DEFAULT_STATUS_CODE = 'default' as const

export const mediaTypes = {
  applicationJson: 'application/json',
  applicationXml: 'application/xml',
  applicationFormUrlEncoded: 'application/x-www-form-urlencoded',
  applicationOctetStream: 'application/octet-stream',
  applicationPdf: 'application/pdf',
  applicationZip: 'application/zip',
  applicationGraphql: 'application/graphql',
  multipartFormData: 'multipart/form-data',
  textPlain: 'text/plain',
  textHtml: 'text/html',
  textCsv: 'text/csv',
  textXml: 'text/xml',
  imagePng: 'image/png',
  imageJpeg: 'image/jpeg',
  imageGif: 'image/gif',
  imageWebp: 'image/webp',
  imageSvgXml: 'image/svg+xml',
  audioMpeg: 'audio/mpeg',
  videoMp4: 'video/mp4',
} as const satisfies Record<string, MediaType>
