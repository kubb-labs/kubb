import { collect, createSchema, narrowSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Oas } from './oas/Oas.ts'
import type { SchemaObject } from './oas/types.ts'
import { isDiscriminator } from './oas/utils.ts'

/**
 * Extracts the schema name from a `$ref` string.
 * For `#/components/schemas/Order` this returns `'Order'`.
 * Falls back to the full ref string when no slash is present.
 */
export function extractRefName($ref: string): string {
  return $ref.split('/').at(-1) ?? $ref
}

/**
 * When `schema` has a `discriminator` and the discriminator property exists in
 * `schema.properties`, widens (or narrows) the discriminator property's `enum`:
 *
 * - Without `specificValue`: sets `enum` to all mapping keys (the full set).
 * - With `specificValue`: sets `enum` to `[specificValue]` **and** strips the
 *   `discriminator` key so that downstream converters (e.g. `convertObject`)
 *   do not re-apply the full set of mapping keys.
 *
 * Returns the schema unchanged when it has no `discriminator` or no matching property.
 */
export function applyDiscriminatorEnum(schema: SchemaObject, specificValue?: string): SchemaObject {
  if (!isDiscriminator(schema)) return schema

  const propName = schema.discriminator.propertyName
  if (!schema.properties?.[propName]) return schema

  const enumValues = specificValue ? [specificValue] : schema.discriminator.mapping ? Object.keys(schema.discriminator.mapping) : undefined

  const updatedProperties = {
    ...schema.properties,
    [propName]: {
      ...(schema.properties[propName] as SchemaObject),
      enum: enumValues,
    },
  } as SchemaObject['properties']

  if (specificValue) {
    // Strip `discriminator` when narrowing so convertObject won't re-apply the full enum.
    const { discriminator: _d, ...base } = schema
    return { ...base, properties: updatedProperties } as SchemaObject
  }

  return { ...schema, properties: updatedProperties } as SchemaObject
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
 */
export function simplifyUnionMembers(members: Array<SchemaNode>): Array<SchemaNode> {
  const scalarPrimitives = new Set(members.filter((m) => ['string', 'number', 'integer', 'bigint', 'boolean'].includes(m.type)).map((m) => m.type as string))
  if (!scalarPrimitives.size) return members

  return members.filter((m) => {
    if (m.type !== 'enum') return true
    const prim = m.primitive
    // Keep the enum if its primitive isn't fully subsumed.
    if (!prim) return true
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
  oas,
}: {
  node: SchemaNode
  nameMapping: Map<string, string>
  resolve: (schemaName: string) => { name: string; path: string } | undefined
  oas?: Oas
}): Array<KubbFile.Import> {
  return collect<KubbFile.Import>(node, {
    schema(schemaNode): KubbFile.Import | undefined {
      if (schemaNode.type !== 'ref' || !schemaNode.ref) return
      // When an OAS instance is provided, verify the $ref exists in the spec.
      if (oas && !oas.get(schemaNode.ref)) return

      const rawName = extractRefName(schemaNode.ref)

      // Apply collision-resolved name if available.
      const schemaName = nameMapping.get(rawName) ?? rawName
      const result = resolve(schemaName)
      if (!result) return

      return { name: [result.name], path: result.path }
    },
  })
}
