import { nodeKinds } from '../constants.ts'
import type { BaseNode } from './base.ts'
import type { ContentNode } from './content.ts'

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Response status code literal used by operations.
 *
 * Includes three-digit HTTP status code strings and `"default"` for catch-all responses.
 *
 * @example
 * ```ts
 * const status: StatusCode = '200'
 * const fallback: StatusCode = 'default'
 * ```
 */
export type StatusCode = `${1 | 2 | 3 | 4 | 5}${Digit}${Digit}` | 'default'

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

type ResponseInput = Pick<ResponseNode, 'statusCode'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode'>>

/**
 * Creates a `ResponseNode`. Body schemas go in `content`, one entry per content type.
 *
 * @example
 * ```ts
 * const response = createResponse({
 *   statusCode: '200',
 *   content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object', properties: [] }) })],
 * })
 * ```
 */
export function createResponse(props: ResponseInput): ResponseNode {
  return { ...props, kind: nodeKinds.response }
}
