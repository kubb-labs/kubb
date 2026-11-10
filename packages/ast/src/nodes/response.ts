import { nodeKinds } from '../constants.ts'
import type { BaseNode } from './base.ts'
import { type ContentNode, createContent } from './content.ts'
import type { InputServer } from './input.ts'
import type { ParameterNode } from './parameter.ts'
import type { SchemaNode } from './schema.ts'

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Response status code literal used by operations.
 *
 * Includes three-digit HTTP status code strings, ranges such as `"2XX"`, and `"default"` for catch-all responses.
 *
 * @example
 * ```ts
 * const status: StatusCode = '200'
 * const fallback: StatusCode = 'default'
 * ```
 */
export type StatusCode = `${1 | 2 | 3 | 4 | 5}${Digit}${Digit}` | `${1 | 2 | 3 | 4 | 5}XX` | 'default'

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
  summary?: string
  /**
   * Optional response description.
   */
  description?: string
  /**
   * All available content type entries for this response.
   *
   * For a response that declares content, the array holds exactly one entry for the adapter
   * `contentType` option when it is set. Otherwise it holds one entry per content type declared in
   * the spec, so that plugins can generate a union of response types (e.g. `application/json` and
   * `application/xml`). A body-less response always keeps a single entry whose `contentType` is `''`
   * and whose `schema` is the empty/`void` placeholder, even when the option is set.
   *
   * @example
   * ```ts
   * // spec response declares both application/json and application/xml
   * response.content[0].contentType // 'application/json'
   * response.content[1].contentType // 'application/xml'
   * ```
   */
  content?: Array<ContentNode>
  /**
   * Response headers, as `in: 'header'` parameters. `Content-Type` is left out.
   */
  headers?: Array<ParameterNode>
  /**
   * Links to operations a client can call next with values from this response, by name.
   */
  links?: Record<string, ResponseLink>
}

/**
 * A link from a response to another operation. `parameters` and `requestBody` hold values or runtime
 * expressions such as `$response.body#/id`, copied as-is.
 */
export type ResponseLink = {
  operationId?: string
  operationRef?: string
  parameters?: Record<string, unknown>
  requestBody?: unknown
  description?: string
  server?: InputServer
}

type ResponseInput = Pick<ResponseNode, 'statusCode'> &
  Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'content'>> & {
    content?: Array<ContentNode>
    schema?: SchemaNode
    mediaType?: string | null
    keysToOmit?: Array<string> | null
  }

/**
 * Creates a `ResponseNode`. A single legacy `schema` (with optional `mediaType`/`keysToOmit`)
 * is normalized into one `content` entry.
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
  const { schema, mediaType, keysToOmit, content, ...rest } = props
  const entries = content ?? (schema ? [createContent({ contentType: mediaType ?? 'application/json', schema, keysToOmit: keysToOmit ?? null })] : undefined)

  return { ...rest, content: entries, kind: nodeKinds.response }
}
