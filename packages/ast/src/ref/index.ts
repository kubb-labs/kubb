export { isBareRef as isBare, resolveRef as getSchema } from '../utils/refs.ts'
import { narrowSchema } from '../guards.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { mergeRefWithSchema, refName, resolveRefName } from '../utils/refs.ts'

/** A resolved ref merged with its target schema, so usage-site fields such as `description` win. Other nodes come back unchanged. */
export function mergeSchema(node: SchemaNode): SchemaNode {
  const ref = narrowSchema(node, 'ref')
  return ref?.schema ? createSchema(mergeRefWithSchema(ref)) : node
}

/**
 * The name a ref points at. A `$ref` string gives its last segment: `'#/components/schemas/Pet'` gives `'Pet'`.
 * A ref node gives its `targetName` first, so pass the node, not `node.ref`, to respect a renamed target. Other nodes give `null`.
 */
export function getName(ref: string): string
export function getName(node: SchemaNode | null | undefined): string | null
export function getName(input: string | SchemaNode | null | undefined): string | null {
  return typeof input === 'string' ? refName(input) : resolveRefName(input)
}
