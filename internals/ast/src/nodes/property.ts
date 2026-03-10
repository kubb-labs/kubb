import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A single property within an object schema.
 *
 * `PropertyNode` carries just enough metadata to allow code-generators to
 * emit correctly typed object members without knowing anything about the
 * originating spec format.
 */
export interface PropertyNode extends BaseNode {
  kind: 'Property'
  /** The property key as it appears in the schema. */
  name: string
  /** The schema that describes the value type of this property. */
  schema: SchemaNode
  /** Whether this property must be present in the object. */
  required: boolean
}
