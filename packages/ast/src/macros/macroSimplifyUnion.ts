import { defineMacro } from '../defineMacro.ts'
import { narrowSchema } from '../guards.ts'
import type { SchemaNode } from '../nodes/schema.ts'

type ScalarPrimitive = 'string' | 'number' | 'integer' | 'bigint' | 'boolean'

/**
 * Scalar primitive schema types used for union simplification and type narrowing.
 */
const SCALAR_PRIMITIVE_TYPES = new Set<ScalarPrimitive>(['string', 'number', 'integer', 'bigint', 'boolean'])


function isScalarPrimitive(type: string): type is ScalarPrimitive {
  return SCALAR_PRIMITIVE_TYPES.has(type as ScalarPrimitive)
}

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

/**
 * Removes union members a broader scalar primitive already covers, such as a multi-value string enum
 * sitting next to a plain `string`. Single-value enums are kept.
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
