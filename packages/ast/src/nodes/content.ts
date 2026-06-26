import { defineNode } from '../defineNode.ts'
import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * AST node representing one content-type entry of a request body or response.
 *
 * There is one entry per content type declared in the spec (e.g. `application/json`,
 * `multipart/form-data`), and each entry holds its own body schema.
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
   * Body schema for this content type. For request and response bodies this already points at the
   * directional `*Request`/`*Response` variant when the schema carries `readOnly`/`writeOnly`
   * properties, so no further omission is needed downstream.
   */
  schema?: SchemaNode
}

/**
 * Definition for the {@link ContentNode}.
 */
export const contentDef = defineNode<ContentNode>({
  kind: 'Content',
  children: ['schema'],
})

/**
 * Creates a `ContentNode` for a single request-body or response content type.
 */
export const createContent = contentDef.create
