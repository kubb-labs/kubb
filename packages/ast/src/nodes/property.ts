import { defineNode, type NodeDef, syncOptionality } from '../node.ts'
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

/**
 * Loosely-typed property accepted by `createProperty`, with `required` optional.
 */
export type UserPropertyNode = Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>

/**
 * Definition for the {@link PropertyNode}. `required` defaults to `false` and the
 * schema's `optional`/`nullish` flags are kept in sync with it.
 */
export const propertyDef: NodeDef<PropertyNode, UserPropertyNode> = defineNode<PropertyNode, UserPropertyNode>({
  kind: 'Property',
  build: (props) => {
    const required = props.required ?? false
    return { ...props, required, schema: syncOptionality(props.schema, required) }
  },
  children: ['schema'],
  visitorKey: 'property',
  finalize: (node) => propertyDef.create(node as PropertyNode),
})

/**
 * Creates a `PropertyNode`.
 *
 * @example
 * ```ts
 * const property = createProperty({
 *   name: 'status',
 *   required: true,
 *   schema: createSchema({ type: 'string', nullable: true }),
 * })
 * // required=true, no optional/nullish
 * ```
 */
export const createProperty = propertyDef.create
