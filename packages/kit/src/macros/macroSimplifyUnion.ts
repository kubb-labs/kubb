import { hash } from 'node:crypto'
import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'

const SCALAR_PRIMITIVE_TYPES = new Set<string>([
  ast.schemaTypes.string,
  ast.schemaTypes.number,
  ast.schemaTypes.integer,
  ast.schemaTypes.bigint,
  ast.schemaTypes.boolean,
])

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

    // Hash each shared subtree once instead of expanding resolved refs into a giant string.
    const entries = Array.isArray(value)
      ? value.map(key)
      : Object.entries(value)
          .filter(([name, child]) => name !== 'pointer' && child !== undefined)
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
 * Filters union members, dropping enum members that a broader scalar primitive already covers.
 */
function simplifyUnionMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const scalarPrimitives = new Set<string>(members.filter((member) => SCALAR_PRIMITIVE_TYPES.has(member.type)).map((m) => m.type))
  if (!scalarPrimitives.size) return members

  return members.filter((member) => {
    const enumNode = ast.narrowSchema(member, ast.schemaTypes.enum)
    if (!enumNode) return true

    const primitive = enumNode.primitive
    if (!primitive) return true

    const enumValueCount = enumNode.namedEnumValues?.length ?? enumNode.enumValues?.length ?? 0
    if (enumValueCount <= 1) return true

    if (scalarPrimitives.has(primitive)) return false
    if (
      (primitive === ast.schemaTypes.integer || primitive === ast.schemaTypes.number) &&
      (scalarPrimitives.has(ast.schemaTypes.integer) || scalarPrimitives.has(ast.schemaTypes.number))
    )
      return false

    return true
  })
}

/**
 * Removes union members that repeat an earlier one, and members a broader scalar primitive already
 * covers, such as a multi-value string enum sitting next to a plain `string`. Single-value enums are kept.
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

    const simplified = simplifyUnionMembers(dedupeMembers(unionNode.members))
    if (simplified.length === unionNode.members.length) return undefined

    return { ...unionNode, members: simplified }
  },
})
