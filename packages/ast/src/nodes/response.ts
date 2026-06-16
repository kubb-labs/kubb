import { defineNode } from '../defineNode.ts'
import type { BaseNode } from './base.ts'
import { type ContentNode, createContent } from './content.ts'
import type { SchemaNode } from './schema.ts'

/**
 * All supported HTTP status code literals as strings, as used in API specs
 * (for example, `"200"` and `"404"`).
 */
type HttpStatusCode =
  // 1xx Informational
  | '100'
  | '101'
  | '102'
  | '103'
  // 2xx Success
  | '200'
  | '201'
  | '202'
  | '203'
  | '204'
  | '205'
  | '206'
  | '207'
  | '208'
  | '226'
  // 3xx Redirection
  | '300'
  | '301'
  | '302'
  | '303'
  | '304'
  | '305'
  | '307'
  | '308'
  // 4xx Client Error
  | '400'
  | '401'
  | '402'
  | '403'
  | '404'
  | '405'
  | '406'
  | '407'
  | '408'
  | '409'
  | '410'
  | '411'
  | '412'
  | '413'
  | '414'
  | '415'
  | '416'
  | '417'
  | '418'
  | '421'
  | '422'
  | '423'
  | '424'
  | '425'
  | '426'
  | '428'
  | '429'
  | '431'
  | '451'
  // 5xx Server Error
  | '500'
  | '501'
  | '502'
  | '503'
  | '504'
  | '505'
  | '506'
  | '507'
  | '508'
  | '510'
  | '511'

/**
 * Response status code literal used by operations.
 *
 * Includes specific HTTP status code strings and `"default"` for catch-all responses.
 *
 * @example
 * ```ts
 * const status: StatusCode = '200'
 * const fallback: StatusCode = 'default'
 * ```
 */
export type StatusCode = HttpStatusCode | 'default'

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
