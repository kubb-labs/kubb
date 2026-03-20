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
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Populated when the response schema is a `$ref` and the referenced schema has
   * `writeOnly` properties that should not appear in response types.
   */
  keysToOmit?: Array<string>
}
