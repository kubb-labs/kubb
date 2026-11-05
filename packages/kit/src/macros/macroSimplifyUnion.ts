import { hash } from 'node:crypto'
import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'

/**
 * Drops members that repeat an earlier one, ignoring the source `pointer` so equal schemas from
 * different places in the spec still match.
 */
function dedupeMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const seen = new Set<string>()
  const keys = new WeakMap<object, string>()

  function key(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined'
    if (value instanceof Date) return key(value.toJSON())
    const cached = keys.get(value)
    if (cached) return cached

    // A ref node's `ref` pointer already identifies its target, so hashing its resolved `schema` as
    // well only walks the same component graph again for every union that references it. The `kind`
    // check keeps plain data under `default` or `examples` hashed in full.
    const node = value as Partial<SchemaNode>
    const skipsSchema = node.kind === ast.nodeKinds.schema && node.type === ast.schemaTypes.ref && typeof node.ref === 'string'
    // Hash each shared subtree once instead of expanding resolved refs into a giant string.
    const entries = Array.isArray(value)
      ? value.map(key)
      : Object.entries(value)
          .filter(([name, child]) => name !== 'pointer' && child !== undefined && !(skipsSchema && name === 'schema'))
          .map(([name, child]) => [name, key(child)])
    const result = hash('sha256', JSON.stringify([Array.isArray(value), entries]))
    keys.set(value, result)
    return result
  }

  return members.filter((member) => {
    const memberKey = key(member)
    if (seen.has(memberKey)) return false
    seen.add(memberKey)

    return true
  })
}

/**
 * Removes union members that repeat an earlier one. Enum members next to a broader scalar, such as
 * `anyOf: [string, enum]`, are kept so the known values survive in the generated code.
 *
 * @example
 * ```ts
 * const next = applyMacros(unionSchema, [macroSimplifyUnion], { depth: 'shallow' })
 * ```
 */
export const macroSimplifyUnion = ast.defineMacro({
  name: 'simplify-union',
  schema(node) {
    const unionNode = ast.narrowSchema(node, ast.schemaTypes.union)
    if (!unionNode?.members?.length) return undefined

    const simplified = dedupeMembers(unionNode.members)
    if (simplified.length === unionNode.members.length) return undefined

    return { ...unionNode, members: simplified }
  },
})
