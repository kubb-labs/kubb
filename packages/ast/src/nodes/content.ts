import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * AST node representing one content-type entry of a request body or response.
 *
 * One entry per content type declared in the spec (e.g. `application/json`,
 * `multipart/form-data`), each carrying its own body schema.
 *
 * @example
 * ```ts
 * const content: ContentNode = {
 *   kind: 'Content',
 *   contentType: 'application/json',
 *   schema: createSchema({ type: 'string' }),
 * }
 * ```
 */
export type ContentNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Content'
  /**
   * The content type for this entry (e.g. `'application/json'`).
   */
  contentType: string
  /**
   * Body schema for this content type.
   */
  schema?: SchemaNode
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Set when a referenced schema has `readOnly`/`writeOnly` fields that should be omitted.
   */
  keysToOmit?: Array<string> | null
}
