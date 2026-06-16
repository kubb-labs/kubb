import { defineNode } from '../defineNode.ts'
import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import { createRequestBody, type RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'

/**
 * HTTP method an operation responds to.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

/**
 * Transport an operation belongs to.
 */
type OperationProtocol = 'http'

/**
 * Fields shared by every operation, regardless of transport.
 */
type OperationNodeBase = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Operation'
  /**
   * Operation identifier, usually from OpenAPI `operationId`.
   */
  operationId: string
  /**
   * Group labels for the operation.
   * Usually copied from OpenAPI `tags`.
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
}

/**
 * Operation served over HTTP/REST (OpenAPI). `method` and `path` are guaranteed.
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
   * OpenAPI-style path string, for example `/pets/{petId}`, with `{param}` notation preserved.
   */
  path: string
}

/**
 * Operation for a non-HTTP transport. HTTP-only fields are forbidden.
 */
export type GenericOperationNode = OperationNodeBase & {
  /**
   * Transport the operation belongs to.
   */
  protocol?: Exclude<OperationProtocol, 'http'>
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
 * Definition for the {@link OperationNode}. HTTP operations (those carrying both
 * `method` and `path`) are tagged with `protocol: 'http'`, and the request body is
 * normalized into a `RequestBodyNode`.
 */
export const operationDef = defineNode<OperationNode, OperationInput>({
  kind: 'Operation',
  build: (props) => {
    const { requestBody, ...rest } = props
    const isHttp = rest.method !== undefined && rest.path !== undefined

    return {
      tags: [],
      parameters: [],
      responses: [],
      ...rest,
      ...(isHttp ? { protocol: 'http' as const } : {}),
      requestBody: requestBody ? createRequestBody(requestBody) : undefined,
    }
  },
  children: ['parameters', 'requestBody', 'responses'],
  visitorKey: 'operation',
})

/**
 * Creates an `OperationNode` with default empty arrays for `tags`, `parameters`, and `responses`.
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
  return operationDef.create(props)
}
