import { defineNode } from '../node.ts'
import type { BaseNode } from './base.ts'
import { type ContentNode, createContent } from './content.ts'
import type { StatusCode } from './http.ts'
import type { SchemaNode } from './schema.ts'

/**
 * AST node representing one operation response variant.
 *
 * Mirrors {@link OperationNode.requestBody}: the response body schemas live exclusively inside
 * the `content` array (one entry per content type), so the same schema is never duplicated at the
 * node root and inside `content`.
 *
 * @example
 * ```ts
 * const response: ResponseNode = {
 *   kind: 'Response',
 *   statusCode: '200',
 *   content: [{ kind: 'Content', contentType: 'application/json', schema: createSchema({ type: 'string' }) }],
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
   * All available content type entries for this response.
   *
   * When the adapter `contentType` option is set, this array contains exactly one entry for that
   * content type. Otherwise it contains one entry per content type declared in the spec, so that
   * plugins can generate a union of response types (e.g. `application/json` and `application/xml`).
   * Body-less responses keep a single entry whose `schema` is the empty/`void` placeholder.
   *
   * @example
   * ```ts
   * // spec response declares both application/json and application/xml
   * response.content[0].contentType // 'application/json'
   * response.content[1].contentType // 'application/xml'
   * ```
   */
  content?: Array<ContentNode>
}

type ResponseInput = Pick<ResponseNode, 'statusCode'> &
  Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'content'>> & {
    content?: Array<ContentNode>
    schema?: SchemaNode
    mediaType?: string | null
    keysToOmit?: Array<string> | null
  }

/**
 * Definition for the {@link ResponseNode}. A single legacy `schema` (with optional
 * `mediaType`/`keysToOmit`) is normalized into one `content` entry.
 */
export const responseDef = defineNode<ResponseNode, ResponseInput>({
  kind: 'Response',
  build: (props) => {
    const { schema, mediaType, keysToOmit, content, ...rest } = props
    const entries = content ?? (schema ? [createContent({ contentType: mediaType ?? 'application/json', schema, keysToOmit: keysToOmit ?? null })] : undefined)
    return { ...rest, content: entries }
  },
  children: ['content'],
  visitorKey: 'response',
})

/**
 * Creates a `ResponseNode`.
 *
 * @example
 * ```ts
 * const response = createResponse({
 *   statusCode: '200',
 *   content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object', properties: [] }) })],
 * })
 * ```
 */
export const createResponse = responseDef.create
