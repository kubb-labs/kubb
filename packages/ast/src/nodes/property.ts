import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/**
 * AST node representing one named object property.
 *
 * @example
 * ```ts
 * const property: PropertyNode = {
 *   kind: 'Property',
 *   name: 'id',
 *   schema: createSchema({ type: 'integer' }),
 *   required: true,
 * }
 * ```
 */
export type PropertyNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Property'
  /**
   * Property key.
   */
  name: string
  /**
   * Property schema.
   */
  schema: SchemaNode
  /**
   * Whether the property is required.
   */
  required: boolean
}
