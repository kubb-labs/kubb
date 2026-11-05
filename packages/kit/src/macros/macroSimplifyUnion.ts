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
 * Drops an enum a broader scalar already covers, except a multi-value string enum beside a plain
 * string. Those literals are the known values of an open string (`anyOf: [string, string enum]`).
 * A name copied from the union is cleared so printers inline `(string & {}) | 'a' | 'b'` instead of
 * a second type with the union's name. Single-value enums are kept either way.
 */
function simplifyEnumMember(member: SchemaNode, scalarPrimitives: Set<string>, unionName: string | null | undefined): SchemaNode | undefined {
  const enumNode = ast.narrowSchema(member, ast.schemaTypes.enum)
  if (!enumNode) return member

  const primitive = enumNode.primitive
  if (!primitive) return member

  const enumValueCount = enumNode.namedEnumValues?.length ?? enumNode.enumValues?.length ?? 0
  if (enumValueCount <= 1) return member

  const covered =
    scalarPrimitives.has(primitive) ||
    ((primitive === ast.schemaTypes.integer || primitive === ast.schemaTypes.number) &&
      (scalarPrimitives.has(ast.schemaTypes.integer) || scalarPrimitives.has(ast.schemaTypes.number)))
  if (!covered) return member

  if (primitive === ast.schemaTypes.string && scalarPrimitives.has(ast.schemaTypes.string)) {
    return enumNode.name && enumNode.name === unionName ? { ...enumNode, name: null } : member
  }

  return undefined
}

/**
 * Filters union members, dropping enum members that a broader scalar primitive already covers.
 * String enums beside a plain string are kept. See {@link simplifyEnumMember}.
 */
function simplifyUnionMembers(members: Array<SchemaNode>, unionName: string | null | undefined): Array<SchemaNode> {
  const scalarPrimitives = new Set<string>(members.filter((member) => SCALAR_PRIMITIVE_TYPES.has(member.type)).map((member) => member.type))
  if (!scalarPrimitives.size) return members

  const simplified: Array<SchemaNode> = []
  for (const member of members) {
    const kept = simplifyEnumMember(member, scalarPrimitives, unionName)
    if (kept) simplified.push(kept)
  }

  return simplified
}

/**
 * Removes union members that repeat an earlier one, and enum members a broader scalar primitive
 * already covers, such as a multi-value number enum next to `number`. A multi-value string enum
 * next to a plain `string` is kept, so the known values survive. Single-value enums are kept.
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

    const simplified = simplifyUnionMembers(dedupeMembers(unionNode.members), unionNode.name)
    if (simplified.length === unionNode.members.length && simplified.every((member, index) => member === unionNode.members?.[index])) return undefined

    return { ...unionNode, members: simplified }
  },
})
