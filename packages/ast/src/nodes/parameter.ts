import { defineNode } from '../defineNode.ts'
import { optionality } from '../optionality.ts'
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
 * Definition for the {@link ParameterNode}. `required` defaults to `false`, and the schema's
 * `optional`/`nullish` flags are derived from it through {@link optionality}.
 */
export const parameterDef = defineNode<ParameterNode, UserParameterNode>({
  kind: 'Parameter',
  build: (props) => {
    const required = props.required ?? false
    return { ...props, required, schema: optionality(props.schema, required) }
  },
  children: ['schema'],
  visitorKey: 'parameter',
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
