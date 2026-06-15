import { isScalarPrimitive } from '../constants.ts'
import { defineMacro } from '../defineMacro.ts'
import { narrowSchema } from '../guards.ts'
import type { SchemaNode } from '../nodes/schema.ts'

/**
 * Removes union members that a broader scalar primitive in the same union already covers, for
 * example dropping a single-value string enum when a plain `string` member is present.
 *
 * @example
 * ```ts
 * const next = applyMacros(unionSchema, [macroSimplifyUnion], { depth: 'shallow' })
 * ```
 */
export const macroSimplifyUnion = defineMacro({
  name: 'simplify-union',
  schema(node) {
    const unionNode = narrowSchema(node, 'union')
    if (!unionNode?.members?.length) return undefined

    const simplified = simplifyUnionMembers(unionNode.members)
    if (simplified.length === unionNode.members.length) return undefined

    return { ...unionNode, members: simplified }
  },
})

/**
 * Filters union members, dropping enum members that a broader scalar primitive already covers.
 */
function simplifyUnionMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const scalarPrimitives = new Set(members.filter((member) => isScalarPrimitive(member.type)).map((m) => m.type))
  if (!scalarPrimitives.size) return members

  return members.filter((member) => {
    const enumNode = narrowSchema(member, 'enum')
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
