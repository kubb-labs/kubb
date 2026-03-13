import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A named property within an object schema.
 */
export interface PropertyNode extends BaseNode {
  kind: 'Property'
  name: string
  schema: SchemaNode
  required: boolean
}
