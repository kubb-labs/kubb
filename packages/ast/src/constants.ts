import type { NodeKind } from './nodes/base.ts'
import type { MediaType } from './nodes/http.ts'
import type { HttpMethod } from './nodes/operation.ts'
import type { SchemaType } from './nodes/schema.ts'

/**
 * Traversal depth for AST visitor utilities.
 *
 * - `'shallow'` — visits only the immediate node, skipping children.
 * - `'deep'` — recursively visits all descendant nodes.
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
  type: 'Type',
  file: 'File',
  import: 'Import',
  export: 'Export',
  source: 'Source',
  text: 'Text',
  break: 'Break',
} as const satisfies Record<string, NodeKind>

/**
 * Schema type discriminators used by all AST schema nodes.
 *
 * These values serve as stable discriminators across the AST (e.g., `schema.type === schemaTypes.object`).
 * Grouped by category: primitives (`string`, `number`, `boolean`), structural types (`object`, `array`, `union`),
 * and format-specific types (`date`, `uuid`, `email`). Use `isScalarPrimitive()` to check for scalar types.
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
 * Scalar primitive schema types used for union simplification and type narrowing.
 *
 * Use `isScalarPrimitive()` to safely check whether a type is a scalar primitive.
 */
export const SCALAR_PRIMITIVE_TYPES = new Set<ScalarPrimitive>(['string', 'number', 'integer', 'bigint', 'boolean'])

/**
 * Type guard that returns `true` when `type` is a scalar primitive schema type.
 *
 * Use this to check if a schema type can be directly assigned without wrapping (e.g., `string | number | boolean`).
 */
export function isScalarPrimitive(type: string): type is ScalarPrimitive {
  return SCALAR_PRIMITIVE_TYPES.has(type as ScalarPrimitive)
}

/**
 * HTTP method identifiers used by operation nodes.
 *
 * Includes all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE).
 */
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

/**
 * Default concurrency limit for `walk()` traversal utility.
 *
 * Set to 30 to balance I/O-bound resolver parallelism against event loop pressure and memory usage during large spec traversals.
 * Use `WALK_CONCURRENCY` when calling `walk()` or override for different hardware constraints.
 *
 * @example
 * ```ts
 * import { walk, WALK_CONCURRENCY } from '@kubb/ast'
 *
 * walk(root, { concurrency: WALK_CONCURRENCY, root: () => {} })
 * ```
 */
export const WALK_CONCURRENCY = 30

/**
 * Common MIME types used in request/response content negotiation.
 *
 * Covers JSON, XML, form data, PDFs, images, audio, and video formats.
 * Use these as keys when serializing request/response bodies.
 */
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
