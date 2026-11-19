import type { HttpOperationNode, OperationNode } from '../nodes/operation.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import type { ResponseNode } from '../nodes/response.ts'
import { collectImportedRefNames } from '../utils/schemaGraph.ts'
import { isError, isSuccess } from './status.ts'

/** The `4xx` and `5xx` responses, ranges included. */
export function filterError(node: Pick<HttpOperationNode, 'responses'>): Array<ResponseNode> {
  return node.responses.filter((response) => isError(response.statusCode))
}

/** The ref names the response bodies import, in order, with repeats. */
export function getImportedNames(responses: ReadonlyArray<ResponseNode>): Array<string> {
  return responses.flatMap((response) => (response.content ?? []).flatMap((entry) => (entry.schema ? collectImportedRefNames(entry.schema) : [])))
}

export function filterSuccess(node: Pick<HttpOperationNode, 'responses'>): Array<ResponseNode> {
  return node.responses.filter((response) => isSuccess(response.statusCode))
}

/** The success response a client returns: one with a body first, then an exact code over a `2xx` range. */
export function findPrimary(node: Pick<HttpOperationNode, 'responses'>): ResponseNode | null {
  const responses = filterSuccess(node)
  const withBody = responses.filter((response) => response.content?.some((entry) => entry.contentType))
  const candidates = withBody.length ? withBody : responses
  return candidates.find((response) => !Number.isNaN(Number(response.statusCode))) ?? candidates[0] ?? null
}

/** A union of refs to the success responses with a body, else every response with a body, else `null`. */
export function getUnion<TNode extends Pick<OperationNode, 'responses'>>(
  node: TNode,
  resolver: { response: { status(node: TNode, statusCode: ResponseNode['statusCode']): string } },
): SchemaNode | null {
  const withSchema = node.responses.filter((response) => response.content?.some((entry) => entry.schema))
  const success = withSchema.filter((response) => isSuccess(response.statusCode))
  const responses = success.length > 0 ? success : withSchema
  if (responses.length === 0) return null

  return createSchema({
    type: 'union',
    members: responses.map((response) => createSchema({ type: 'ref', name: resolver.response.status(node, response.statusCode) })),
  })
}
