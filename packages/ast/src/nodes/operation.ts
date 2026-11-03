import { nodeKinds } from '../constants.ts'
import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import { createRequestBody, type RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'

/**
 * HTTP method an operation responds to. `QUERY` is the safe, idempotent method with a request body
 * from RFC 10008, declared with the `query` field of an OpenAPI 3.2 path item.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'QUERY'

/**
 * Fields shared by every operation, regardless of transport.
 */
type OperationNodeBase = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Operation'
  /**
   * Stable identifier for the operation.
   */
  operationId: string
  /**
   * Group labels for the operation.
   */
  tags: Array<string>
  /**
   * Short one-line operation summary.
   */
  summary?: string
  /**
   * Full operation description.
   */
  description?: string
  /**
   * Marks the operation as deprecated.
   */
  deprecated?: boolean
  /**
   * Query, path, header, and cookie parameters for the operation.
   */
  parameters: Array<ParameterNode>
  /**
   * Request body for the operation.
   */
  requestBody?: RequestBodyNode
  /**
   * Operation responses.
   */
  responses: Array<ResponseNode>
  /**
   * Vendor extensions (`x-*` keys) from the source operation, copied as-is. Absent when the source has none.
   */
  extensions?: Record<string, unknown>
}

/**
 * Operation served over HTTP. `method` and `path` are guaranteed.
 *
 * @example
 * ```ts
 * const operation: HttpOperationNode = {
 *   kind: 'Operation',
 *   operationId: 'listPets',
 *   protocol: 'http',
 *   method: 'GET',
 *   path: '/pets',
 *   tags: [],
 *   parameters: [],
 *   responses: [],
 * }
 * ```
 */
export type HttpOperationNode = OperationNodeBase & {
  /**
   * Transport the operation belongs to.
   */
  protocol?: 'http'
  /**
   * HTTP method like `'GET'`.
   */
  method: HttpMethod
  /**
   * Path string, for example `/pets/{petId}`, with `{param}` notation preserved.
   */
  path: string
}

/**
 * Operation for a non-HTTP transport. HTTP-only fields are forbidden.
 */
export type GenericOperationNode = OperationNodeBase & {
  protocol?: never
  method?: never
  path?: never
}

/**
 * AST node representing one API operation.
 *
 * Discriminated on `protocol`: an {@link HttpOperationNode} (`protocol: 'http'`) guarantees
 * `method` and `path`, while a {@link GenericOperationNode} omits them. Narrow with
 * `isHttpOperationNode(node)` or `node.protocol === 'http'` before reading `method`/`path`.
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
 *
 * @example
 * ```ts
 * const operation = createOperation({ operationId: 'getPetById', method: 'GET', path: '/pet/{petId}' })
 * // tags, parameters, and responses are []
 * ```
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
    kind: nodeKinds.operation,
    ...(isHttp ? { protocol: 'http' as const } : {}),
    requestBody: requestBody ? createRequestBody(requestBody) : undefined,
  }

  return node as OperationNode
}
