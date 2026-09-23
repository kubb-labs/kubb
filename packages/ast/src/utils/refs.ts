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

/**
 * Returns `true` when a schema is a bare ref without modifiers, metadata, or omit keys.
 *
 * Modifiers inherited from the resolved schema are included in the check because a ref emits the
 * referenced schema variable with those modifiers already applied.
 */
export function isBareRef(node: SchemaNode | null | undefined, keysToOmit?: Array<string> | null): boolean {
  if (!node || node.type !== 'ref') return false

  const meta = (() => {
    if (!node.schema) return node

    const { kind: _kind, type: _type, name: _name, ref: _ref, schema: _schema, ...overrides } = node
    const definedOverrides = Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined))

    return { ...node.schema, ...definedOverrides }
  })()

  return !meta.nullable && !meta.optional && !meta.nullish && meta.default === undefined && !meta.description && !meta.examples?.length && !keysToOmit?.length
}
