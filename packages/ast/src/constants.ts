import type { NodeKind } from './nodes/base.ts'
import type { MediaType } from './nodes/http.ts'
import type { HttpMethod } from './nodes/operation.ts'
import type { ParameterLocation } from './nodes/parameter.ts'
import type { SchemaType } from './nodes/schema.ts'

/**
 * Depth for schema traversal in visitor functions.
 */
export type VisitorDepth = 'shallow' | 'deep'

export const visitorDepths = {
  shallow: 'shallow',
  deep: 'deep',
} as const satisfies Record<VisitorDepth, VisitorDepth>

export const nodeKinds = {
  root: 'Root',
  operation: 'Operation',
  schema: 'Schema',
  property: 'Property',
  parameter: 'Parameter',
  response: 'Response',
  functionParameter: 'FunctionParameter',
  objectBindingParameter: 'ObjectBindingParameter',
  functionParameters: 'FunctionParameters',
} as const satisfies Record<string, NodeKind>

export const schemaTypes = {
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
  boolean: 'boolean',
  null: 'null',
  any: 'any',
  unknown: 'unknown',
  void: 'void',
  object: 'object',
  array: 'array',
  tuple: 'tuple',
  union: 'union',
  intersection: 'intersection',
  enum: 'enum',
  ref: 'ref',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  uuid: 'uuid',
  email: 'email',
  url: 'url',
  blob: 'blob',
  never: 'never',
} as const satisfies Record<SchemaType, SchemaType>

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
 * Default max concurrent visitor calls in `walk`.
 */
export const WALK_CONCURRENCY = 30

/**
 * Fallback status code string for API spec responses.
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
