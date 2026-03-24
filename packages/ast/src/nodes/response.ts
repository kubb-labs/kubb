import type { BaseNode } from './base.ts'
import type { MediaType, StatusCode } from './http.ts'
import type { SchemaNode } from './schema.ts'

/**
 * AST node representing one operation response variant.
 *
 * @example
 * ```ts
 * const response: ResponseNode = {
 *   kind: 'Response',
 *   statusCode: '200',
 *   schema: createSchema({ type: 'string' }),
 * }
 * ```
 */
export type ResponseNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Response'
  /**
   * HTTP status code or `'default'` for a fallback response.
   */
  statusCode: StatusCode
  /**
   * Optional response description.
   */
  description?: string
  /**
   * Response body schema.
   */
  schema: SchemaNode
  /**
   * Response media type.
   */
  mediaType?: MediaType
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Set when a referenced schema has `writeOnly` fields that should not appear in response types.
   */
  keysToOmit?: Array<string>
}
