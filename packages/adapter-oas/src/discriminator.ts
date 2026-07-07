import { ast, type SchemaNodeByType } from '@kubb/ast'

export type DiscriminatorTarget = {
  propertyName: string
  enumValues: Array<string | number | boolean>
}

/**
 * Maps each child schema name to its discriminator patch data by scanning the given
 * top-level AST schema nodes for union schemas that carry a `discriminatorPropertyName`.
 *
 * Called on a small pre-parsed subset of schemas (only the discriminator parents)
 * rather than on all schemas at once.
 */
export function buildDiscriminatorChildMap(schemas: Array<ast.SchemaNode>): Map<string, DiscriminatorTarget> {
  const childMap = new Map<string, DiscriminatorTarget>()

  for (const schema of schemas) {
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

      let refNode: SchemaNodeByType['ref'] | null = null
      let objNode: SchemaNodeByType['object'] | null = null

      for (const m of intersectionNode.members) {
        refNode ??= ast.narrowSchema(m, 'ref')
        objNode ??= ast.narrowSchema(m, 'object')
      }

      if (!refNode?.name || !objNode) continue

      const prop = objNode.properties.find((p) => p.name === discriminatorPropertyName)
      const enumNode = prop ? ast.narrowSchema(prop.schema, 'enum') : null
      if (!enumNode?.enumValues?.length) continue

      const enumValues = enumNode.enumValues.filter((v): v is string | number | boolean => v !== null)
      if (!enumValues.length) continue

      const existing = childMap.get(refNode.name)
      if (!existing) {
        childMap.set(refNode.name, { propertyName: discriminatorPropertyName, enumValues: [...enumValues] })
        continue
      }
      existing.enumValues.push(...enumValues)
    }
  }

  return childMap
}

/**
 * Patches a single top-level `SchemaNode` with its discriminator entry (adds or replaces
 * the discriminant property).
 */
export function patchDiscriminatorNode(node: ast.SchemaNode, entry: { propertyName: string; enumValues: Array<string | number | boolean> }): ast.SchemaNode {
  const objectNode = ast.narrowSchema(node, 'object')
  if (!objectNode) return node

  const { propertyName, enumValues } = entry
  const enumSchema = ast.factory.createSchema({ type: 'enum', enumValues })
  const newProp = ast.factory.createProperty({ name: propertyName, required: true, schema: enumSchema })

  const existingIdx = objectNode.properties.findIndex((p) => p.name === propertyName)
  const newProperties = existingIdx >= 0 ? objectNode.properties.map((p, i) => (i === existingIdx ? newProp : p)) : [...objectNode.properties, newProp]

  return { ...objectNode, properties: newProperties }
}

/**
 * Creates a single-property object schema used as a discriminator literal.
 *
 * @example
 * ```ts
 * createDiscriminantNode({ propertyName: 'type', value: 'dog' })
 * // -> { type: 'object', properties: [{ name: 'type', required: true, schema: enum('dog') }] }
 * ```
 */
export function createDiscriminantNode({ propertyName, value }: { propertyName: string; value: string }): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    properties: [
      ast.factory.createProperty({
        name: propertyName,
        schema: ast.factory.createSchema({
          type: 'enum',
          primitive: 'string',
          enumValues: [value],
        }),
        required: true,
      }),
    ],
  })
}

/**
 * Returns the discriminator key whose mapping value matches `ref`, or `null` when there is no match.
 *
 * @example
 * ```ts
 * findDiscriminator({ dog: '#/components/schemas/Dog' }, '#/components/schemas/Dog') // 'dog'
 * ```
 */
export function findDiscriminator(mapping: Record<string, string> | undefined, ref: string | undefined): string | null {
  if (!mapping || !ref) return null
  return Object.entries(mapping).find(([, value]) => value === ref)?.[0] ?? null
}
