import type { BaseNode } from './base.ts'
import type { ContentNode } from './content.ts'
import type { ParameterNode } from './parameter.ts'
import type { ResponseNode } from './response.ts'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

/**
 * Transport / spec family an operation belongs to. Open-ended so adapters can use
 * their own value; the listed members cover the common cases.
 */
export type OperationProtocol = 'http' | 'ws' | 'kafka' | 'amqp' | 'mqtt' | 'graphql' | (string & {})

/**
 * Generic operation verb for specs without an HTTP method — AsyncAPI pub/sub
 * (`send`/`receive`) and GraphQL roots (`query`/`mutation`/`subscription`).
 */
export type OperationAction = 'send' | 'receive' | 'query' | 'mutation' | 'subscription' | (string & {})

/**
 * AST node representing an operation request body.
 *
 * Body schemas live exclusively inside the `content` array (one entry per content type),
 * mirroring {@link ResponseNode}.
 *
 * @example
 * ```ts
 * const requestBody: RequestBodyNode = {
 *   kind: 'RequestBody',
 *   required: true,
 *   content: [{ kind: 'Content', contentType: 'application/json', schema: createSchema({ type: 'string' }) }],
 * }
 * ```
 */
export type RequestBodyNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'RequestBody'
  /**
   * Human-readable request body description.
   */
  description?: string
  /**
   * Whether the request body is required (`requestBody.required: true` in the spec).
   * When `false` or absent, the generated `data` parameter should be optional.
   */
  required?: boolean
  /**
   * All available content type entries for this request body.
   *
   * When the adapter `contentType` option is set, this array contains exactly one entry for
   * that content type. Otherwise it contains one entry per content type declared in the spec,
   * so that plugins can generate code for every variant (e.g. separate hooks for
   * `application/json` and `multipart/form-data`).
   */
  content?: Array<ContentNode>
}

/**
 * AST node representing one API operation.
 *
 * @example
 * ```ts
 * const operation: OperationNode = {
 *   kind: 'Operation',
 *   operationId: 'listPets',
 *   method: 'GET',
 *   path: '/pets',
 *   tags: [],
 *   parameters: [],
 *   responses: [],
 * }
 * ```
 */
export type OperationNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Operation'
  /**
   * Operation identifier, usually from OpenAPI `operationId`.
   */
  operationId: string
  /**
   * HTTP method like `'GET'`. Optional — only HTTP/REST specs (OpenAPI) set it;
   * other specs use {@link OperationNode.action} instead.
   */
  method?: HttpMethod
  /**
   * OpenAPI-style path string, for example `/pets/{petId}`, with `{param}` notation
   * preserved. Optional — only HTTP/REST specs set it.
   */
  path?: string
  /**
   * Transport / spec family (e.g. `'http'`, `'graphql'`, `'kafka'`). Lets a plugin
   * branch on the source spec without assuming HTTP.
   */
  protocol?: OperationProtocol
  /**
   * Generic verb for non-HTTP specs — AsyncAPI `send`/`receive`, GraphQL
   * `query`/`mutation`/`subscription`.
   */
  action?: OperationAction
  /**
   * Channel address (AsyncAPI) or generic target the operation acts on.
   */
  channel?: string
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
