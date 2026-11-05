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
   * Body schema for this content type. For a sequential media type this is the same node as
   * `itemSchema`, so a plugin that only reads `schema` types one item instead of the whole stream.
   */
  schema?: SchemaNode
  /**
   * Schema of one item of a sequential media type, from the OpenAPI 3.2 `itemSchema`, or from
   * `schema` on a `text/event-stream` entry in a 3.0 or 3.1 document where it describes one event.
   * Absent for complete (non-sequential) content.
   */
  itemSchema?: SchemaNode
  /**
   * `true` when the content is a sequence of items (`text/event-stream`, `application/jsonl`,
   * `application/x-ndjson`, `application/json-seq`, `application/geo+json-seq`, `multipart/mixed`,
   * or any media type that declares `itemSchema`), so a client should stream it instead of
   * reading one body.
   */
  sequential?: boolean
  /**
   * For `text/event-stream`: `'event'` when `itemSchema` describes the parsed event with its
   * `event`, `data`, `id` and `retry` fields, `'data'` when it only describes the `data` payload
   * and the client wraps it in its own event type.
   */
  itemShape?: 'event' | 'data'
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
