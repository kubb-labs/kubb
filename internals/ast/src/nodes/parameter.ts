import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Where in the HTTP request a parameter lives.
 * Kept spec-agnostic: GraphQL variables, gRPC metadata, and OAS parameters
 * can all be mapped to one of these locations.
 */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie'

/**
 * A single input parameter for an operation.
 */
export interface ParameterNode extends BaseNode {
  kind: 'Parameter'
  /** The name of the parameter (e.g. `"petId"`, `"Authorization"`). */
  name: string
  /** Where the parameter is passed. */
  in: ParameterLocation
  /** The schema describing the parameter's value. */
  schema: SchemaNode
  /** Whether the parameter must be supplied by callers. */
  required: boolean
  /** Human-readable description. */
  description?: string
  /** Whether this parameter is deprecated. */
  deprecated?: boolean
}
