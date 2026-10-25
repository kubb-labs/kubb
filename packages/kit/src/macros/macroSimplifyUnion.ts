import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'

const SCALAR_PRIMITIVE_TYPES = new Set<string>(['string', 'number', 'integer', 'bigint', 'boolean'])

/**
 * Drops members that repeat an earlier one, ignoring the source `pointer` so equal schemas from
 * different places in the spec still match.
 */
function dedupeMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const seen = new Set<string>()

  return members.filter((member) => {
    const key = JSON.stringify(member, (name, value) => (name === 'pointer' ? undefined : value))
    if (seen.has(key)) return false
    seen.add(key)

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
    const enumNode = ast.narrowSchema(member, 'enum')
    if (!enumNode) return true

    const primitive = enumNode.primitive
    if (!primitive) return true

    const enumValueCount = enumNode.namedEnumValues?.length ?? enumNode.enumValues?.length ?? 0
    if (enumValueCount <= 1) return true

    if (scalarPrimitives.has(primitive)) return false
    if ((primitive === 'integer' || primitive === 'number') && (scalarPrimitives.has('integer') || scalarPrimitives.has('number'))) return false

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
    const unionNode = ast.narrowSchema(node, 'union')
    if (!unionNode?.members?.length) return undefined

    const simplified = simplifyUnionMembers(dedupeMembers(unionNode.members))
    if (simplified.length === unionNode.members.length) return undefined

    return { ...unionNode, members: simplified }
  },
})
