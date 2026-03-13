import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie'

/**
 * A single input parameter for an operation.
 */
export interface ParameterNode extends BaseNode {
  kind: 'Parameter'
  name: string
  in: ParameterLocation
  schema: SchemaNode
  required: boolean
}
