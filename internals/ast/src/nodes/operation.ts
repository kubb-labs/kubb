import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

/** Standard HTTP methods. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'

/**
 * A spec-agnostic representation of a single API operation (endpoint).
 *
 * This node is produced by a parser (e.g. `plugin-oas`) and consumed by
 * code-generators (e.g. `plugin-ts`, `plugin-react-query`) without any
 * knowledge of the source specification format.
 */
export interface OperationNode extends BaseNode {
  kind: 'Operation'
  /**
   * A stable, unique identifier for this operation.
   * In OAS this maps to `operationId`; other spec formats should provide an equivalent slug.
   */
  operationId: string
  /** HTTP method. */
  method: HttpMethod
  /** URL path template (e.g. `"/pets/{petId}"`). */
  path: string
  /** Classification tags (e.g. OAS `tags`). */
  tags: Array<string>
  /** Short summary of what the operation does. */
  summary?: string
  /** Longer description of the operation. */
  description?: string
  /** Whether this operation is marked as deprecated. */
  deprecated?: boolean
  /** Path, query, header, and cookie parameters. */
  parameters: Array<ParameterNode>
  /**
   * The request body schema, if the operation accepts a body.
   * For OAS `requestBody` this is the schema of the first content entry.
   */
  requestBody?: SchemaNode
  /** All possible responses, keyed by status code or `"default"`. */
  responses: Array<ResponseNode>
}
