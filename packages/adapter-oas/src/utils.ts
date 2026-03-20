import { collect, createProperty, createSchema, narrowSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import type { KubbFile } from '@kubb/fabric-core/types'
import { SCALAR_PRIMITIVE_TYPES } from './constants.ts'

/**
 * Extracts the schema name from a `$ref` string.
 * For `#/components/schemas/Order` this returns `'Order'`.
 * Falls back to the full ref string when no slash is present.
 */
export function extractRefName($ref: string): string {
  return $ref.split('/').at(-1) ?? $ref
}

/**
 * Replaces the discriminator property's schema inside an `ObjectSchemaNode`
 * with an enum of the given `values`.
 *
 * - When `enumName` is provided the enum is named, which lets printers emit a
 *   standalone enum declaration + type reference (e.g. `PetTypeEnum`).
 * - When `enumName` is omitted the enum stays anonymous, so printers inline it
 *   as a literal union (e.g. `'dog'`).
 *
 * Returns the node unchanged when it is not an object or lacks the target property.
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
  if (node.type !== 'object' || !node.properties?.length) return node

  const hasProperty = node.properties.some((prop) => prop.name === propertyName)
  if (!hasProperty) return node

  return createSchema({
    ...node,
    properties: node.properties.map((prop) => {
      if (prop.name !== propertyName) return prop

      const enumSchema: SchemaNode = createSchema({
        type: 'enum' as const,
        primitive: 'string' as const,
        enumValues: values,
        name: enumName,
        readOnly: prop.schema.readOnly,
        writeOnly: prop.schema.writeOnly,
      })

      return createProperty({
        ...prop,
        schema: enumSchema,
      })
    }),
  })
}

/**
 * Merges consecutive anonymous (`name`-less) `ObjectSchemaNode`s in `members` into a
 * single object by combining their `properties` arrays.
 *
 * Only adjacent pairs are merged — non-object or named nodes act as boundaries.
 * This collapses patterns like `Address & { streetNumber } & { streetName }` into
 * `Address & { streetNumber; streetName }`.
 */
export function mergeAdjacentAnonymousObjects(members: Array<SchemaNode>): Array<SchemaNode> {
  return members.reduce<Array<SchemaNode>>((acc, member) => {
    const obj = narrowSchema(member, 'object')
    if (obj && !obj.name) {
      const prev = acc[acc.length - 1]
      const prevObj = prev ? narrowSchema(prev, 'object') : null
      if (prevObj && !prevObj.name) {
        acc[acc.length - 1] = createSchema({
          ...prevObj,
          properties: [...(prevObj.properties ?? []), ...(obj.properties ?? [])],
        }) as SchemaNode
        return acc
      }
    }
    acc.push(member)
    return acc
  }, [])
}

/**
 * Simplifies a union member list by removing `enum` nodes whose `primitive` type is
 * already represented by a broader scalar node in the same union.
 *
 * For example `['placed', 'approved'] | string` collapses to `string` because
 * `string` subsumes all string literals.  `'' | string` similarly becomes `string`.
 *
 * Only scalar primitives (`string`, `number`, `integer`, `bigint`, `boolean`) are
 * considered — object, array, and ref members are left untouched.
 *
 * Const-derived enums (those without an `enumType`, produced from an OpenAPI `const`
 * keyword) are **never** removed — `'accepted' | string` must stay as-is because the
 * literal is intentional.
 */
export function simplifyUnionMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const scalarPrimitives = new Set(members.filter((m) => SCALAR_PRIMITIVE_TYPES.has(m.type as 'string')).map((m) => m.type as string))
  if (!scalarPrimitives.size) return members

  return members.filter((m) => {
    if (m.type !== 'enum') return true
    const prim = m.primitive
    // Keep the enum if its primitive isn't fully subsumed.
    if (!prim) return true
    // Const-derived enums have no `enumType`; keep them as intentional literals.
    if (!m.enumType) return true
    // `number` subsumes `integer` literals and vice-versa for our purposes.
    if (scalarPrimitives.has(prim)) return false
    if ((prim === 'integer' || prim === 'number') && (scalarPrimitives.has('integer') || scalarPrimitives.has('number'))) return false
    return true
  })
}

/**
 * `nameMapping`, and calls `resolve` to obtain the `{ name, path }` pair for
 * each import. When `oas` is supplied, only `$ref`s that are resolvable in the
 * spec are included; omit it to skip the existence check.
 *
 * This function is the pure, state-free alternative to `OasParser.getImports`.
 * Because it receives `nameMapping` explicitly it can be called without holding
 * a reference to the parser or the OAS instance.
 *
 * @example
 * ```ts
 * // Use adapter state directly — no parser reference needed
 * const imports = getImports({
 *   node: schemaNode,
 *   nameMapping: adapter.options.nameMapping,
 *   resolve: (schemaName) => ({
 *     name: schemaManager.getName(schemaName, { type: 'type' }),
 *     path: schemaManager.getFile(schemaName).path,
 *   }),
 * })
 * ```
 */
export function getImports({
  node,
  nameMapping,
  resolve,
}: {
  node: SchemaNode
  nameMapping: Map<string, string>
  resolve: (schemaName: string) => { name: string; path: string } | undefined
}): Array<KubbFile.Import> {
  return collect<KubbFile.Import>(node, {
    schema(schemaNode): KubbFile.Import | undefined {
      if (schemaNode.type !== 'ref' || !schemaNode.ref) return

      const rawName = extractRefName(schemaNode.ref)

      // Apply collision-resolved name if available.
      const schemaName = nameMapping.get(rawName) ?? rawName
      const result = resolve(schemaName)
      if (!result) return

      return { name: [result.name], path: result.path }
    },
  })
}
