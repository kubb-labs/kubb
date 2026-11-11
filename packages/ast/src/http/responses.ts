import type { HttpOperationNode } from '../nodes/operation.ts'
import type { ResponseNode } from '../nodes/response.ts'
import { isSuccess } from './status.ts'

/**
 * The operation's `2xx` responses, in the order the source lists them.
 *
 * @example
 * ```ts
 * ast.http.responses.success(node).map((response) => response.statusCode)
 * ```
 */
export function success(node: Pick<HttpOperationNode, 'responses'>): Array<ResponseNode> {
  return node.responses.filter((response) => isSuccess(response.statusCode))
}

/**
 * The success response a client returns: a response with a body wins over one without, such as `204`, and then
 * an exact code such as `200` wins over a `2xx` range listed before it. Returns `null` without a success response.
 *
 * @example
 * ```ts
 * ast.http.responses.primary(node)?.content
 * ```
 */
export function primary(node: Pick<HttpOperationNode, 'responses'>): ResponseNode | null {
  const responses = success(node)
  const withBody = responses.filter((response) => response.content?.length)
  const candidates = withBody.length ? withBody : responses
  return candidates.find((response) => !Number.isNaN(Number(response.statusCode))) ?? candidates[0] ?? null
}
