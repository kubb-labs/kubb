import { narrowSchema } from '../guards.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { mergeRefWithSchema } from '../utils/refs.ts'

/** A resolved ref merged with its target schema, so usage-site fields such as `description` win. Other nodes come back unchanged. */
export function sync(node: SchemaNode): SchemaNode {
  const ref = narrowSchema(node, 'ref')
  return ref?.schema ? createSchema(mergeRefWithSchema(ref)) : node
}
