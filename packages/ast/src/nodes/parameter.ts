import { defineNode, type NodeDef, syncOptionality } from '../node.ts'
import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie'

/**
 * AST node representing one operation parameter.
 *
 * @example
 * ```ts
 * const param: ParameterNode = {
 *   kind: 'Parameter',
 *   name: 'petId',
 *   in: 'path',
 *   schema: createSchema({ type: 'string' }),
 *   required: true,
 * }
 * ```
 */
export type ParameterNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Parameter'
  /**
   * Parameter name.
   */
  name: string
  /**
   * Parameter location (`path`, `query`, `header`, or `cookie`).
   */
  in: ParameterLocation
  /**
   * Parameter schema.
   */
  schema: SchemaNode
  /**
   * Whether the parameter is required.
   */
  required: boolean
}

type UserParameterNode = Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>

/**
 * Definition for the {@link ParameterNode}. `required` defaults to `false` and the
 * schema's `optional`/`nullish` flags are kept in sync with it.
 */
export const parameterDef: NodeDef<ParameterNode, UserParameterNode> = defineNode<ParameterNode, UserParameterNode>({
  kind: 'Parameter',
  build: (props) => {
    const required = props.required ?? false
    return { ...props, required, schema: syncOptionality(props.schema, required) }
  },
  children: ['schema'],
  visitorKey: 'parameter',
  finalize: (node) => parameterDef.create(node as ParameterNode),
})

/**
 * Creates a `ParameterNode`.
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'petId',
 *   in: 'path',
 *   required: true,
 *   schema: createSchema({ type: 'string' }),
 * })
 * ```
 */
export const createParameter = parameterDef.create
