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
   *
   * Always populated with the primary (JSON-preferred) content type so existing consumers keep
   * working. For the full per-content-type breakdown use {@link ResponseNode.content}.
   */
  schema: SchemaNode
  /**
   * Response media type of the primary content type.
   */
  mediaType?: MediaType | null
  /**
   * All available content type entries for this response.
   *
   * When the adapter `contentType` option is set, this array contains exactly one entry for that
   * content type. Otherwise it contains one entry per content type declared in the spec, so that
   * plugins can generate a union of response types (e.g. `application/json` and `application/xml`).
   *
   * @example
   * ```ts
   * // spec response declares both application/json and application/xml
   * response.content[0].contentType // 'application/json'
   * response.content[1].contentType // 'application/xml'
   * ```
   */
  content?: Array<{
    /**
     * The content type for this entry (e.g. `'application/json'`).
     */
    contentType: string
    /**
     * Response body schema for this content type.
     */
    schema?: SchemaNode
    /**
     * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
     * Set when a referenced schema has `writeOnly` fields that should not appear in response types.
     */
    keysToOmit?: Array<string> | null
  }>
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Set when a referenced schema has `writeOnly` fields that should not appear in response types.
   */
  keysToOmit?: Array<string> | null
}
