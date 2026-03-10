import type { BaseNode } from './base.ts'
import type { MediaType, StatusCode } from './http.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A single response variant for an operation.
 *
 * `statusCode` is a known HTTP status code string (e.g. `"200"`, `"404"`)
 * or `"default"` for a fallback response.
 */
export interface ResponseNode extends BaseNode {
  kind: 'Response'
  /**
   * HTTP status code (e.g. `"200"`, `"404"`) or `"default"`
   * for a fallback response.
   */
  statusCode: StatusCode
  /** Human-readable description of when this response is returned. */
  description?: string
  /** The body schema, if the response has a body. */
  schema?: SchemaNode
  /** Media type of the response body (e.g. `"application/json"`). */
  mediaType?: MediaType
}
