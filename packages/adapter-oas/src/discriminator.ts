import { ast } from '@kubb/core'

type DiscriminatorTarget = {
  propertyName: string
  enumValues: Array<string | number | boolean>
}

/**
 * Injects discriminator enum values into child schemas so they know which value identifies them.
 *
 * Finds every union schema in `input.schemas` that has a `discriminatorPropertyName`, collects the
 * enum value each union member is mapped to, then adds (or replaces) that property on the matching
 * child object schema.
 *
 * Returns a new `InputNode` — the original is never mutated.
 *
 * @example
 * ```ts
 * const { root } = parseOas(document, options)
 * const next = applyDiscriminatorInheritance(root)
 * ```
 */
export function applyDiscriminatorInheritance(root: ast.InputNode): ast.InputNode {
  const childMap = new Map<string, DiscriminatorTarget>()

  for (const schema of root.schemas) {
    // Case 1: top-level schema is a union (oneOf/anyOf with discriminator)
    // Case 2: top-level schema is an intersection wrapping a union (oneOf/anyOf + shared properties)
    let unionNode = ast.narrowSchema(schema, 'union')

    if (!unionNode) {
      const intersectionMembers = ast.narrowSchema(schema, 'intersection')?.members
      if (intersectionMembers) {
        for (const m of intersectionMembers) {
          const u = ast.narrowSchema(m, 'union')
          if (u) {
            unionNode = u
            break
          }
        }
      }
    }

    if (!unionNode?.discriminatorPropertyName || !unionNode.members) continue

    const { discriminatorPropertyName, members } = unionNode

    for (const member of members) {
      // Members with a discriminant value are intersections: [RefSchemaNode, ObjectSchemaNode]
      const intersectionNode = ast.narrowSchema(member, 'intersection')
      if (!intersectionNode?.members) continue

      let refNode: ReturnType<typeof ast.narrowSchema<'ref'>> | undefined
      let objNode: ReturnType<typeof ast.narrowSchema<'object'>> | undefined

      for (const m of intersectionNode.members) {
        refNode ??= ast.narrowSchema(m, 'ref')
        objNode ??= ast.narrowSchema(m, 'object')
      }

      if (!refNode?.name || !objNode) continue

      const prop = objNode.properties.find((p) => p.name === discriminatorPropertyName)
      const enumNode = prop ? ast.narrowSchema(prop.schema, 'enum') : undefined
      if (!enumNode?.enumValues?.length) continue

      const enumValues = enumNode.enumValues.filter((v): v is string | number | boolean => v !== null)
      if (!enumValues.length) continue

      const existing = childMap.get(refNode.name)
      if (existing) {
        existing.enumValues.push(...enumValues)
      } else {
        childMap.set(refNode.name, {
          propertyName: discriminatorPropertyName,
          enumValues: [...enumValues],
        })
      }
    }
  }

  if (childMap.size === 0) return root

  return ast.transform(root, {
    schema(node, { parent }) {
      if (parent?.kind !== 'Input' || !node.name) return

      const entry = childMap.get(node.name)
      if (!entry) return

      const objectNode = ast.narrowSchema(node, 'object')
      if (!objectNode) return

      const { propertyName, enumValues } = entry
      const enumSchema = ast.createSchema({ type: 'enum', enumValues })
      const newProp = ast.createProperty({
        name: propertyName,
        required: true,
        schema: enumSchema,
      })

      const existingIdx = objectNode.properties.findIndex((p) => p.name === propertyName)
      const newProperties = existingIdx >= 0 ? objectNode.properties.map((p, i) => (i === existingIdx ? newProp : p)) : [...objectNode.properties, newProp]

      return { ...objectNode, properties: newProperties }
    },
  })
}
