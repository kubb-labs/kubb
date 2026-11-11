import type { HttpOperationNode } from '../nodes/operation.ts'
import type { ResponseNode } from '../nodes/response.ts'
import { isSuccess } from './status.ts'

export function success(node: Pick<HttpOperationNode, 'responses'>): Array<ResponseNode> {
  return node.responses.filter((response) => isSuccess(response.statusCode))
}

/** The success response a client returns: one with a body first, then an exact code over a `2xx` range. */
export function primary(node: Pick<HttpOperationNode, 'responses'>): ResponseNode | null {
  const responses = success(node)
  const withBody = responses.filter((response) => response.content?.some((entry) => entry.contentType))
  const candidates = withBody.length ? withBody : responses
  return candidates.find((response) => !Number.isNaN(Number(response.statusCode))) ?? candidates[0] ?? null
}
