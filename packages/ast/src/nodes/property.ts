import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A named property within an object schema.
 */
export type PropertyNode = BaseNode & {
  kind: 'Property'
  name: string
  schema: SchemaNode
  required: boolean
}
