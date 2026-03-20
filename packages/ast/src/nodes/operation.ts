import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

/**
 * A spec-agnostic representation of a single API operation.
 */
export type OperationNode = BaseNode & {
  kind: 'Operation'
  /**
   * Unique operation identifier (maps to `operationId` in OAS).
   */
  operationId: string
  method: HttpMethod
  /**
   * Express-style path string, e.g. `/pets/:petId`.
   * Derived from the OpenAPI path by converting `{param}` tokens to `:param`.
   */
  path: string
  tags: Array<string>
  summary?: string
  description?: string
  deprecated?: boolean
  parameters: Array<ParameterNode>
  /**
   * Request body for OAS operations. Bundles the schema with optional keys to exclude.
   */
  requestBody?: {
    /**
     * The request body schema. For OAS, this is the schema of the first content entry.
     */
    schema?: SchemaNode
    /**
     * Property keys to exclude from the generated request body type via `Omit<Type, Keys>`.
     * Populated when the schema is a `$ref` and the referenced schema has `readOnly` properties
     * that should not appear in request types.
     */
    keysToOmit?: Array<string>
  }
  responses: Array<ResponseNode>
}
