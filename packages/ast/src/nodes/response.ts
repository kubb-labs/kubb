import type { BaseNode } from './base.ts'
import type { MediaType, StatusCode } from './http.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A single response variant for an operation.
 */
export type ResponseNode = BaseNode & {
  kind: 'Response'
  /**
   * HTTP status code or `'default'` for a fallback response.
   */
  statusCode: StatusCode
  description?: string
  schema: SchemaNode
  mediaType?: MediaType
}
