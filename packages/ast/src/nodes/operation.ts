import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

/**
 * A spec-agnostic representation of a single API operation.
 */
export interface OperationNode extends BaseNode {
  kind: 'Operation'
  /**
   * Unique operation identifier (maps to `operationId` in OAS).
   */
  operationId: string
  method: HttpMethod
  path: string
  tags: Array<string>
  summary?: string
  description?: string
  deprecated?: boolean
  parameters: Array<ParameterNode>
  /**
   * Request body schema. For OAS, this is the schema of the first content entry.
   */
  requestBody?: SchemaNode
  responses: Array<ResponseNode>
}
