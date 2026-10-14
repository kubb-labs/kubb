import { optionality } from '../optionality.ts'
import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie'

/** How a parameter value is serialized into the request. */
export type ParameterStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'

/** One operation parameter. */
export type ParameterNode = BaseNode & {
  kind: 'Parameter'
  name: string
  in: ParameterLocation
  schema: SchemaNode
  required: boolean
  /** Absent when the source omits it, leaving consumers to apply the per-location default. */
  style?: ParameterStyle
  /** Whether array and object values expand into separate values. Absent when the source omits it. */
  explode?: boolean
}

type UserParameterNode = Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>

/** Creates a `ParameterNode`. `required` defaults to `false` and derives the schema's `optional`/`nullish` flags. */
export function createParameter(input: UserParameterNode): ParameterNode {
  const required = input.required ?? false

  return { ...input, required, schema: optionality(input.schema, required), kind: 'Parameter' }
}
