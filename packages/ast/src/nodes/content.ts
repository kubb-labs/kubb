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
  encoding?: Record<string, EncodingNode>
  /**
   * Serialization of the first parts by position, for a part that is itself a multipart body.
   */
  prefixEncoding?: Array<EncodingNode>
  /**
   * Serialization of every part after `prefixEncoding`, for a part that is itself a multipart body.
   */
  itemEncoding?: EncodingNode
}

export type ExampleNode = {
  /**
   * Key of the example in the source, absent for a single unnamed example.
   */
  name?: string
  summary?: string
  description?: string
  value?: unknown
  /**
   * The example as it is sent on the wire, such as a URL-encoded query string.
   */
  serializedValue?: string
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
   * The content type for this entry (e.g. `'application/json'`), or `''` for a response without a body.
   */
  contentType: string
  /**
   * Body schema for this content type. For a stream it is the same node as `stream.schema`.
   */
  schema?: SchemaNode
  /**
   * Set when the content is a stream of items (an event stream, JSON Lines, a channel of messages) instead of one body.
   */
  stream?: {
    /**
     * Schema of one item, such as one event of `text/event-stream` or one line of JSON Lines.
     */
    schema?: SchemaNode
    /**
     * What `schema` describes for an event stream.
     * - `'event'` the parsed event with its `event`, `data`, `id` and `retry` fields
     * - `'data'` only the `data` payload, which the client wraps in its own event type
     */
    shape?: 'event' | 'data'
  }
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Set when a referenced schema has `readOnly`/`writeOnly` fields that should be omitted.
   */
  keysToOmit?: Array<string> | null
  /**
   * Serialization settings per body property that sets at least one field in the spec's `encoding`.
   */
  encoding?: Record<string, EncodingNode>
  examples?: Array<ExampleNode>
  /**
   * Serialization of the first parts by position, for a body sent as an array of parts such as `multipart/mixed`.
   */
  prefixEncoding?: Array<EncodingNode>
  /**
   * Serialization of every part after `prefixEncoding`, for a body sent as an array of parts such as `multipart/mixed`.
   */
  itemEncoding?: EncodingNode
}

/**
 * Creates a `ContentNode` for a single request-body or response content type.
 */
export const createContent = nodeFactory<ContentNode>(nodeKinds.content)
