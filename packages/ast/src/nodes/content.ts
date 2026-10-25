import { nodeKinds } from '../constants.ts'
import { type BaseNode, nodeFactory } from './base.ts'
import type { ParameterStyle } from './parameter.ts'
import type { SchemaNode } from './schema.ts'

/**
 * How one body property is serialized, from the `encoding` entry of its media type.
 */
export type EncodingNode = {
  /**
   * Content type of the part, for example `'application/json'` for a multipart property.
   */
  contentType?: string
  /**
   * Serialization style of the property.
   */
  style?: ParameterStyle
  /**
   * Whether array and object values expand into separate values.
   */
  explode?: boolean
  /**
   * Whether reserved characters are sent as-is instead of percent-encoded.
   */
  allowReserved?: boolean
}

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
   * Body schema for this content type.
   */
  schema?: SchemaNode
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Set when a referenced schema has `readOnly`/`writeOnly` fields that should be omitted.
   */
  keysToOmit?: Array<string> | null
  /**
   * Serialization settings per body property that sets at least one field in the spec's `encoding`.
   */
  encoding?: Record<string, EncodingNode>
}

/**
 * Creates a `ContentNode` for a single request-body or response content type.
 */
export const createContent = nodeFactory<ContentNode>(nodeKinds.content)
