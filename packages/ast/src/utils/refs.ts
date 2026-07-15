import type { SchemaNode } from '../nodes/index.ts'

/**
 * Resolves the emitted name of the schema a ref node points at. Prefers `targetName` (set when
 * the referenced schema was renamed, e.g. to break a collision), then the last segment of `ref`,
 * then `name`, then the nested `schema.name`.
 *
 * Returns `null` for non-ref nodes or when no name resolves.
 *
 * @example
 * `resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Pet' }) // 'Pet'`
 *
 * @example Collision-renamed target
 * `resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Order', targetName: 'OrderSchema' }) // 'OrderSchema'`
 */
export function resolveRefName(node: SchemaNode | null | undefined): string | null {
  if (!node || node.type !== 'ref') return null
  if (node.targetName) return node.targetName
  if (node.ref) return node.ref.split('/').at(-1) ?? node.ref

  return node.name ?? node.schema?.name ?? null
}
