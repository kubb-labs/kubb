import { SCALAR_PRIMITIVE_TYPES } from './constants.ts'
import { createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * Replaces a discriminator property's schema with a string enum of allowed values.
 *
 * If `node` is not an object schema, or if the property does not exist, the input
 * node is returned as-is.
 *
 * @example
 * ```ts
 * const schema = createSchema({
 *   type: 'object',
 *   properties: [createProperty({ name: 'type', required: true, schema: createSchema({ type: 'string' }) })],
 * })
 * const result = applyDiscriminatorEnum({ node: schema, propertyName: 'type', values: ['dog', 'cat'] })
 * ```
 */
export function applyDiscriminatorEnum({
  node,
  propertyName,
  values,
  enumName,
}: {
  node: SchemaNode
  propertyName: string
  values: Array<string>
  enumName?: string
}): SchemaNode {
  const objectNode = narrowSchema(node, 'object')
  if (!objectNode?.properties?.length) {
    return node
  }

  const hasProperty = objectNode.properties.some((prop) => prop.name === propertyName)
  if (!hasProperty) {
    return node
  }

  return createSchema({
    ...objectNode,
    properties: objectNode.properties.map((prop) => {
      if (prop.name !== propertyName) {
        return prop
      }

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
}

/**
 * Merges adjacent anonymous object members into a single anonymous object member.
 *
 * @example
 * ```ts
 * const merged = mergeAdjacentAnonymousObjects([
 *   createSchema({ type: 'object', properties: [createProperty({ name: 'a', schema: createSchema({ type: 'string' }) })] }),
 *   createSchema({ type: 'object', properties: [createProperty({ name: 'b', schema: createSchema({ type: 'number' }) })] }),
 * ])
 * ```
 */
export function mergeAdjacentAnonymousObjects(members: Array<SchemaNode>): Array<SchemaNode> {
  return members.reduce<Array<SchemaNode>>((acc, member) => {
    const objectMember = narrowSchema(member, 'object')
    if (objectMember && !objectMember.name) {
      const previous = acc.at(-1)
      const previousObject = previous ? narrowSchema(previous, 'object') : undefined

      if (previousObject && !previousObject.name) {
        acc[acc.length - 1] = createSchema({
          ...previousObject,
          properties: [...(previousObject.properties ?? []), ...(objectMember.properties ?? [])],
        })
        return acc
      }
    }

    acc.push(member)
    return acc
  }, [])
}

/**
 * Removes enum members that are covered by broader scalar primitives in the same union.
 *
 * @example
 * ```ts
 * const simplified = simplifyUnionMembers([
 *   createSchema({ type: 'enum', primitive: 'string', enumValues: ['active'] }),
 *   createSchema({ type: 'string' }),
 * ])
 * // keeps only string member
 * ```
 */
export function simplifyUnionMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const scalarPrimitives = new Set(
    members.filter((member) => SCALAR_PRIMITIVE_TYPES.has(member.type as typeof SCALAR_PRIMITIVE_TYPES extends Set<infer T> ? T : never)).map((m) => m.type),
  )

  if (!scalarPrimitives.size) {
    return members
  }

  return members.filter((member) => {
    const enumNode = narrowSchema(member, 'enum')
    if (!enumNode) {
      return true
    }

    const primitive = enumNode.primitive
    if (!primitive) {
      return true
    }

    const enumValueCount = enumNode.namedEnumValues?.length ?? enumNode.enumValues?.length ?? 0
    if (enumValueCount <= 1) {
      return true
    }

    if (scalarPrimitives.has(primitive)) {
      return false
    }

    if ((primitive === 'integer' || primitive === 'number') && (scalarPrimitives.has('integer') || scalarPrimitives.has('number'))) {
      return false
    }

    return true
  })
}
