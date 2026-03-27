import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

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
   * HTTP Method like 'GET'
   */
  method: HttpMethod
  /**
   * OpenAPI-style path string, for example `/pets/{petId}`.
   * Path parameters retain the `{param}` notation from the original spec.
   */
  path: string
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
   * Request body metadata for the operation.
   */
  requestBody?: {
    /**
     * Human-readable request body description.
     */
    description?: string
    /**
     * Request body schema.
     * For OpenAPI, this is the schema from the first `content` entry.
     */
    schema?: SchemaNode
    /**
     * Property keys to exclude from the generated request body type via `Omit<Type, Keys>`.
     * Set when a referenced schema has `readOnly` fields that should be omitted in request types.
     */
    keysToOmit?: Array<string>
    /**
     * Whether the request body is required (`requestBody.required: true` in the spec).
     * When `false` or absent, the generated `data` parameter should be optional.
     */
    required?: boolean
  }
  /**
   * Operation responses.
   */
  responses: Array<ResponseNode>
}
