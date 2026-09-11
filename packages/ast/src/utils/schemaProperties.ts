import type { PropertyNode, SchemaNode } from '../nodes/index.ts'

/**
 * Finds every matching property exposed by an object, resolved reference, or intersection.
 *
 * References are followed through their parsed `schema`. Circular references terminate without
 * revisiting a node. Unions are not traversed because a property on one branch does not describe
 * every branch.
 *
 * @example Faker discriminator narrowing
 * ```ts
 * const values = resolveSchemaProperties({ node: member, propertyName: union.discriminatorPropertyName }).flatMap(({ schema }) =>
 *   getSchemaLiteralValues(schema),
 * )
 * const typeName = `Extract<Pet, { type: ${values.map(JSON.stringify).join(' | ')} }>`
 * ```
 *
 * @example Zod discriminated unions
 * ```ts
 * const canDiscriminate = union.members?.every(
 *   (member) => resolveSchemaProperties({ node: member, propertyName: 'type' }).length > 0,
 * )
 * const expression = canDiscriminate ? `z.discriminatedUnion('type', members)` : `z.union(members)`
 * ```
 *
 * @example TypeScript property lookup
 * ```ts
 * const properties = resolveSchemaProperties({ node: schema, propertyName: 'status' })
 * const statusSchemas = properties.map((property) => print(property.schema))
 * ```
 */
export function resolveSchemaProperties({ node, propertyName }: { node: SchemaNode; propertyName: string }): ReadonlyArray<PropertyNode> {
  const properties: Array<PropertyNode> = []
  const visited = new WeakSet<SchemaNode>()

  function visit(current: SchemaNode | null | undefined): void {
    if (!current || visited.has(current)) return
    visited.add(current)

    if (current.type === 'object') {
      const property = current.properties.find((candidate) => candidate.name === propertyName)
      if (property) properties.push(property)
      return
    }

    if (current.type === 'ref') {
      visit(current.schema)
      return
    }

    if (current.type === 'intersection') {
      for (const member of current.members ?? []) visit(member)
    }
  }

  visit(node)
  return properties
}

/**
 * Reads the unique literal values represented by an enum, resolved reference, or union.
 *
 * Named enum values take precedence over simple enum values, matching how renderers consume
 * `EnumSchemaNode`.
 *
 * @example
 * ```ts
 * const values = getSchemaLiteralValues(enumNode)
 * // ['cat', 'dog']
 * ```
 */
export function getSchemaLiteralValues(node: SchemaNode): ReadonlyArray<string | number | boolean | null> {
  const values = new Set<string | number | boolean | null>()
  const visited = new WeakSet<SchemaNode>()

  function visit(current: SchemaNode | null | undefined): void {
    if (!current || visited.has(current)) return
    visited.add(current)

    if (current.type === 'enum') {
      const enumValues = current.namedEnumValues?.map(({ value }) => value) ?? current.enumValues ?? []
      for (const value of enumValues) values.add(value)
      return
    }

    if (current.type === 'ref') {
      visit(current.schema)
      return
    }

    if (current.type === 'union') {
      for (const member of current.members ?? []) visit(member)
    }
  }

  visit(node)
  return [...values]
}

// Names of every property an object, resolved reference, or intersection exposes.
function collectPropertyNames(node: SchemaNode, visited: WeakSet<SchemaNode> = new WeakSet()): Set<string> {
  if (visited.has(node)) return new Set()
  visited.add(node)

  if (node.type === 'object') return new Set(node.properties.map((property) => property.name))
  if (node.type === 'ref') return node.schema ? collectPropertyNames(node.schema, visited) : new Set()

  if (node.type === 'intersection') {
    const names = new Set<string>()
    for (const member of node.members ?? []) {
      for (const name of collectPropertyNames(member, visited)) names.add(name)
    }
    return names
  }

  return new Set()
}

/**
 * Infers an implicit discriminator: a property every member exposes with a distinct single
 * literal value, the same shape a declared OpenAPI `discriminator` already narrows on.
 */
export function inferDiscriminatorPropertyName(members: ReadonlyArray<SchemaNode>): string | undefined {
  if (members.length < 2) return undefined

  let candidates: Set<string> | undefined
  for (const member of members) {
    const names = collectPropertyNames(member)
    candidates = candidates ? new Set([...candidates].filter((name) => names.has(name))) : names
  }

  for (const name of candidates ?? []) {
    const values = members.map((member) => {
      const literals = resolveSchemaProperties({ node: member, propertyName: name }).flatMap((property) => getSchemaLiteralValues(property.schema))
      return literals.length === 1 ? literals[0] : undefined
    })

    if (values.every((value) => value !== undefined) && new Set(values).size === members.length) {
      return name
    }
  }

  return undefined
}
