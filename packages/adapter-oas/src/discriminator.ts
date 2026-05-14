import { ast } from '@kubb/core'

type DiscriminatorTarget = {
  propertyName: string
  enumValues: Array<string | number | boolean>
}

/**
 * Map from child schema name to the discriminator enum values it inherits.
 * Built incrementally as schemas are streamed in, then consumed during a
 * second pass to patch matching child object schemas.
 */
export type DiscriminatorChildMap = Map<string, DiscriminatorTarget>

/**
 * Inspects a single top-level schema and records any discriminator targets
 * it implies. Safe to call once per streamed schema during parse.
 */
export function collectDiscriminatorTargets(schema: ast.SchemaNode, childMap: DiscriminatorChildMap): void {
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

  if (!unionNode?.discriminatorPropertyName || !unionNode.members) return

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

/**
 * Returns a patched copy of `node` if it matches a discriminator target in
 * `childMap`, otherwise returns `node` unchanged. Used by the streaming
 * discriminator pass to rewrite a single schema in place.
 */
export function patchDiscriminatorChild(node: ast.SchemaNode, childMap: DiscriminatorChildMap): ast.SchemaNode {
  if (!node.name) return node
  const entry = childMap.get(node.name)
  if (!entry) return node

  const objectNode = ast.narrowSchema(node, 'object')
  if (!objectNode) return node

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
}

/**
 * Injects discriminator enum values into child schemas so they know which
 * value identifies them.
 *
 * Pure array-in / array-out so callers can operate on either an in-memory
 * snapshot (tests, the eager `parseOas` helper) or a streamed batch from
 * storage. Returns the same `schemas` reference when no discriminator
 * targets apply, so callers can short-circuit.
 *
 * Streaming adapters that want to avoid buffering the whole array should
 * collect targets via `collectDiscriminatorTargets` while parsing and then
 * call `patchDiscriminatorChild` per node when re-streaming from storage.
 */
export function applyDiscriminatorInheritance(schemas: ast.SchemaNode[]): ast.SchemaNode[] {
  const childMap: DiscriminatorChildMap = new Map()
  for (const schema of schemas) collectDiscriminatorTargets(schema, childMap)
  if (childMap.size === 0) return schemas

  return schemas.map((schema) => patchDiscriminatorChild(schema, childMap))
}
