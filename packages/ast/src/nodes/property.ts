import { optionality } from '../optionality.ts'
import type { BaseNode } from './base.ts'
import type { SchemaNode } from './schema.ts'

/** One named object property. */
export type PropertyNode = BaseNode & {
  kind: 'Property'
  name: string
  schema: SchemaNode
  required: boolean
}

type UserPropertyNode = Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>

/** Creates a `PropertyNode`. `required` defaults to `false` and derives the schema's `optional`/`nullish` flags. */
export function createProperty(input: UserPropertyNode): PropertyNode {
  const required = input.required ?? false

  return { ...input, required, schema: optionality(input.schema, required), kind: 'Property' }
}
