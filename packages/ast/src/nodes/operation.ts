import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import type { RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'

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
   * Parameters that could be used, we have QueryParams, PathParams, HeaderParams and CookieParams
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
