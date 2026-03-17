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

  // Strip `discriminator` when narrowing so convertObject won't re-apply the full enum.
  const { discriminator: _d, ...base } = specificValue ? (schema as SchemaObject & { discriminator?: unknown }) : { ...schema, discriminator: undefined }

  return {
    ...(specificValue ? base : schema),
    properties: {
      ...schema.properties,
      [propName]: {
        ...(schema.properties[propName] as SchemaObject),
        enum: enumValues,
      },
    },
  } as SchemaObject
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
 * Walks `node` looking for `ref` nodes, applies collision-resolved names from
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
