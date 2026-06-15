import { isScalarPrimitive } from './constants.ts'
import { narrowSchema } from './guards.ts'
import { defineMacro } from './macro.ts'
import { createProperty } from './nodes/property.ts'
import { createSchema, type SchemaNode } from './nodes/schema.ts'
import { enumPropName } from './utils/refs.ts'

/**
 * Builds a macro that replaces a discriminator property's schema with a string enum of the allowed
 * values. Applied to the object schema that carries the property. When the node is not an object
 * schema, or the property is missing, the node is returned unchanged.
 *
 * @example
 * ```ts
 * const macro = macroDiscriminatorEnum({ propertyName: 'type', values: ['dog', 'cat'] })
 * const next = applyMacros(objectSchema, [macro], { depth: 'shallow' })
 * ```
 */
export function macroDiscriminatorEnum({ propertyName, values, enumName }: { propertyName: string; values: Array<string>; enumName?: string }) {
  return defineMacro({
    name: 'discriminator-enum',
    schema(node) {
      const objectNode = narrowSchema(node, 'object')
      if (!objectNode?.properties?.length) return undefined
      if (!objectNode.properties.some((prop) => prop.name === propertyName)) return undefined

      return createSchema({
        ...objectNode,
        properties: objectNode.properties.map((prop) => {
          if (prop.name !== propertyName) return prop

          return createProperty({
            ...prop,
            schema: createSchema({
              type: 'enum',
              primitive: 'string',
              enumValues: values,
              name: enumName,
              readOnly: prop.schema.readOnly,
              writeOnly: prop.schema.writeOnly,
            }),
          })
        }),
      })
    },
  })
}

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
 * Builds a macro that names an inline enum schema from its parent and property name. Boolean enums
 * are cleared to an anonymous name. Non-enum nodes are returned unchanged.
 *
 * @example
 * ```ts
 * const macro = macroEnumName({ parentName: 'Pet', propName: 'status', enumSuffix: 'enum' })
 * const named = applyMacros(propSchema, [macro], { depth: 'shallow' })
 * ```
 */
export function macroEnumName({ parentName, propName, enumSuffix }: { parentName: string | null | undefined; propName: string; enumSuffix: string }) {
  return defineMacro({
    name: 'enum-name',
    schema(node) {
      const enumNode = narrowSchema(node, 'enum')
      if (enumNode?.primitive === 'boolean') return { ...node, name: null }
      if (enumNode) return { ...node, name: enumPropName(parentName, propName, enumSuffix) }
      return undefined
    },
  })
}

/**
 * Filters union members, dropping enum members that a broader scalar primitive already covers.
 * Shared by `macroSimplifyUnion`.
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
