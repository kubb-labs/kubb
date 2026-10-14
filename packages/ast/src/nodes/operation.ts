import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import { createRequestBody, type RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'

/**
 * HTTP method an operation responds to. `QUERY` is the safe, idempotent method with a request body
 * from RFC 10008, declared with the `query` field of an OpenAPI 3.2 path item.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'QUERY'

/** Fields shared by every operation, regardless of transport. */
type OperationNodeBase = BaseNode & {
  kind: 'Operation'
  operationId: string
  tags: Array<string>
  summary?: string
  description?: string
  deprecated?: boolean
  parameters: Array<ParameterNode>
  requestBody?: RequestBodyNode
  responses: Array<ResponseNode>
}

/** Operation served over HTTP. `method` and `path` are guaranteed. */
export type HttpOperationNode = OperationNodeBase & {
  protocol?: 'http'
  method: HttpMethod
  /** For example `/pets/{petId}`, with `{param}` notation preserved. */
  path: string
}

/** Operation for a non-HTTP transport. HTTP-only fields are forbidden. */
export type GenericOperationNode = OperationNodeBase & {
  protocol?: never
  method?: never
  path?: never
}

/**
 * One API operation. Discriminated on `protocol`: an {@link HttpOperationNode} (`protocol: 'http'`)
 * guarantees `method` and `path`, while a {@link GenericOperationNode} omits them. Narrow with
 * `isHttpOperationNode(node)` before reading `method`/`path`.
 */
export type OperationNode = HttpOperationNode | GenericOperationNode

type OperationInput = {
  operationId: string
  method?: HttpOperationNode['method']
  path?: HttpOperationNode['path']
  requestBody?: Omit<RequestBodyNode, 'kind'>
  [key: string]: unknown
}

/**
 * Creates an `OperationNode` with default empty arrays for `tags`, `parameters`, and `responses`.
 * HTTP operations (those carrying both `method` and `path`) are tagged with `protocol: 'http'`,
 * and the request body is normalized into a `RequestBodyNode`.
 */
export function createOperation(
  props: Pick<HttpOperationNode, 'operationId' | 'method' | 'path'> &
    Partial<Omit<HttpOperationNode, 'kind' | 'operationId' | 'method' | 'path' | 'requestBody'>> & {
      requestBody?: Omit<RequestBodyNode, 'kind'>
    },
): HttpOperationNode
export function createOperation(
  props: Pick<GenericOperationNode, 'operationId'> &
    Partial<Omit<GenericOperationNode, 'kind' | 'operationId' | 'requestBody'>> & {
      requestBody?: Omit<RequestBodyNode, 'kind'>
    },
): GenericOperationNode
export function createOperation(props: OperationInput): OperationNode {
  const { requestBody, ...rest } = props
  const isHttp = rest.method !== undefined && rest.path !== undefined

  const node = {
    tags: [],
    parameters: [],
    responses: [],
    ...rest,
    kind: 'Operation' as const,
    ...(isHttp ? { protocol: 'http' as const } : {}),
    requestBody: requestBody ? createRequestBody(requestBody) : undefined,
  }

  return node as OperationNode
}
