import type { RefSchemaNode, SchemaNode } from '../nodes/schema.ts'

/** Returns the last segment of a `$ref` pointer, for example `'Pet'` for `#/components/schemas/Pet`. */
export function refName(ref: string): string {
  return ref.split('/').at(-1) ?? ref
}

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
  if (node.ref) return refName(node.ref)

  return node.name ?? node.schema?.name ?? null
}

/**
 * Follows resolved ref nodes to the schema they point to. Returns an unresolved or cyclic ref as is.
 */
export function resolveRef(node: SchemaNode): SchemaNode {
  if (node.type !== 'ref' || !node.schema) return node

  const seen = new WeakSet<SchemaNode>()
  let current: SchemaNode = node
  while (current.type === 'ref' && current.schema) {
    if (seen.has(current)) return current
    seen.add(current)
    current = current.schema
  }
  return current
}

/** Fields of a ref node that describe the ref itself, so they never override the resolved schema. */
const REF_OWN_KEYS: ReadonlySet<string> = new Set(['kind', 'type', 'name', 'ref', 'schema'])

/**
 * Merges a ref node with its resolved schema, giving the fields set at the usage site precedence.
 *
 * Every field on the ref except `kind`, `type`, `name`, `ref`, and `schema` overrides the same field
 * of the resolved `schema` (for example `description`, `nullable`, `readOnly`, `deprecated`). Fields
 * left `undefined` on the ref do not shadow the resolved schema. A ref without a resolved `schema`
 * is returned as is.
 *
 * @example
 * ```ts
 * const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Pet', description: 'A pet', schema: petSchema })
 * mergeRefWithSchema(ref) // petSchema's fields with description 'A pet'
 * ```
 */
export function mergeRefWithSchema(node: RefSchemaNode): SchemaNode {
  if (!node.schema) return node

  const merged: Record<string, unknown> = { ...node.schema }
  for (const key of Object.keys(node)) {
    const value = (node as Record<string, unknown>)[key]
    if (value !== undefined && !REF_OWN_KEYS.has(key)) merged[key] = value
  }

  return merged as SchemaNode
}

/**
 * Returns `true` when a schema is a bare ref without modifiers, metadata, or omit keys.
 *
 * Modifiers inherited from the resolved schema are included in the check because a ref emits the
 * referenced schema variable with those modifiers already applied.
 */
export function isBareRef(node: SchemaNode | null | undefined, keysToOmit?: Array<string> | null): boolean {
  if (!node || node.type !== 'ref') return false

  const meta = mergeRefWithSchema(node)

  return !meta.nullable && !meta.optional && !meta.nullish && meta.default === undefined && !meta.description && !meta.examples?.length && !keysToOmit?.length
}
