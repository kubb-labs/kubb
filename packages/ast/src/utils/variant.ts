import { pascalCase } from '@internals/utils'
import { narrowSchema } from '../guards.ts'
import { createProperty } from '../nodes/property.ts'
import type { SchemaNode } from '../nodes/schema.ts'
import { createSchema } from '../nodes/schema.ts'
import { resolveRefName, syncSchemaRef } from './refs.ts'

/**
 * The two directional schema variants. A `request` shape drops `readOnly` properties, the
 * server-set fields a client may not send. A `response` shape drops `writeOnly` properties, the
 * request-only fields a server never returns.
 */
export type SchemaVariant = 'request' | 'response'

const FLAG_BY_VARIANT = {
  request: 'readOnly',
  response: 'writeOnly',
} as const satisfies Record<SchemaVariant, 'readOnly' | 'writeOnly'>

/**
 * Builds the variant schema name from a base name, matching the `*Request`/`*Response` convention.
 *
 * @example
 * `variantName('User', 'request') // 'UserRequest'`
 */
export function variantName(baseName: string, variant: SchemaVariant): string {
  return pascalCase([baseName, variant].join(' '))
}

/**
 * Reports whether a property schema carries the directional flag, checking a `$ref` node's
 * usage-site sibling as well as its resolved target.
 */
function hasDirectionalFlag(schema: SchemaNode, flag: 'readOnly' | 'writeOnly'): boolean {
  if (schema[flag]) return true
  if (schema.type === 'ref') return !!syncSchemaRef(schema)[flag]
  return false
}

/**
 * Structural analysis of a single named schema, used to decide which variants it needs.
 */
export type SchemaVariantAnalysis = {
  /**
   * Whether the schema's own tree (not crossing into other named `$ref`s) has a `readOnly` property.
   */
  readOnly: boolean
  /**
   * Whether the schema's own tree (not crossing into other named `$ref`s) has a `writeOnly` property.
   */
  writeOnly: boolean
  /**
   * Names of other named schemas this schema references, so flags can propagate transitively.
   */
  refs: Array<string>
}

/**
 * Walks a schema's own structure to find directly-declared `readOnly`/`writeOnly` properties and
 * the names of the schemas it references. Recurses through inline objects, arrays, tuples, unions,
 * and intersections, but stops at `$ref` boundaries (those targets are analyzed on their own).
 */
export function analyzeSchemaForVariants(node: SchemaNode): SchemaVariantAnalysis {
  const result: SchemaVariantAnalysis = { readOnly: false, writeOnly: false, refs: [] }

  function walk(schema: SchemaNode): void {
    const ref = narrowSchema(schema, 'ref')
    if (ref) {
      const name = resolveRefName(ref)
      if (name) result.refs.push(name)
      if (ref.readOnly) result.readOnly = true
      if (ref.writeOnly) result.writeOnly = true
      return
    }

    const object = narrowSchema(schema, 'object')
    if (object) {
      for (const property of object.properties) {
        if (hasDirectionalFlag(property.schema, 'readOnly')) result.readOnly = true
        if (hasDirectionalFlag(property.schema, 'writeOnly')) result.writeOnly = true
        walk(property.schema)
      }
      if (typeof object.additionalProperties === 'object') walk(object.additionalProperties)
      if (object.patternProperties) {
        for (const value of Object.values(object.patternProperties)) walk(value)
      }
      return
    }

    const array = narrowSchema(schema, 'array') ?? narrowSchema(schema, 'tuple')
    if (array) {
      for (const item of array.items ?? []) walk(item)
      if (array.rest) walk(array.rest)
      return
    }

    const members = narrowSchema(schema, 'union')?.members ?? narrowSchema(schema, 'intersection')?.members
    if (members) {
      for (const member of members) walk(member)
    }
  }

  walk(node)
  return result
}

/**
 * Computes, via a fixpoint over the reference graph, which named schemas need a `request` and/or
 * `response` variant. A schema needs a variant when its own tree declares a flagged property, or
 * when it (transitively) references another schema that needs that variant.
 */
export function computeVariantNames(schemas: Array<{ name: string; node: SchemaNode }>): Record<SchemaVariant, Set<string>> {
  const analyses = new Map<string, SchemaVariantAnalysis>()
  for (const { name, node } of schemas) analyses.set(name, analyzeSchemaForVariants(node))

  const request = new Set<string>()
  const response = new Set<string>()
  for (const [name, analysis] of analyses) {
    if (analysis.readOnly) request.add(name)
    if (analysis.writeOnly) response.add(name)
  }

  let changed = true
  while (changed) {
    changed = false
    for (const [name, analysis] of analyses) {
      for (const ref of analysis.refs) {
        if (request.has(ref) && !request.has(name)) {
          request.add(name)
          changed = true
        }
        if (response.has(ref) && !response.has(name)) {
          response.add(name)
          changed = true
        }
      }
    }
  }

  return { request, response }
}

/**
 * Produces a directional variant of a schema by recursively dropping the flagged properties and
 * rewiring nested `$ref`s to the variant of their target (when that target has one).
 *
 * Filtering happens structurally, at construction time, so nested objects are filtered too, which
 * a top-level `Omit`/`.omit` cannot do. `variantNames` is the set of named schemas that have a
 * variant in this direction. Refs to those are renamed, and refs to unaffected schemas are left
 * as they are.
 *
 * @example
 * ```ts
 * buildSchemaVariant({ node: userSchema, variant: 'request', variantNames: new Set(['Address']) })
 * // User without its readOnly props; nested `Address` ref becomes `AddressRequest`
 * ```
 */
export function buildSchemaVariant({ node, variant, variantNames }: { node: SchemaNode; variant: SchemaVariant; variantNames: Set<string> }): SchemaNode {
  const flag = FLAG_BY_VARIANT[variant]

  function transform(schema: SchemaNode): SchemaNode {
    const object = narrowSchema(schema, 'object')
    if (object) {
      const properties = object.properties
        .filter((property) => !hasDirectionalFlag(property.schema, flag))
        .map((property) => createProperty({ ...property, schema: transform(property.schema) }))
      const additionalProperties = typeof object.additionalProperties === 'object' ? transform(object.additionalProperties) : object.additionalProperties
      const patternProperties = object.patternProperties
        ? Object.fromEntries(Object.entries(object.patternProperties).map(([pattern, value]) => [pattern, transform(value)]))
        : undefined
      return createSchema({ ...object, properties, additionalProperties, patternProperties })
    }

    const array = narrowSchema(schema, 'array') ?? narrowSchema(schema, 'tuple')
    if (array) {
      return createSchema({ ...array, items: array.items?.map(transform), rest: array.rest ? transform(array.rest) : undefined })
    }

    const union = narrowSchema(schema, 'union')
    if (union) return createSchema({ ...union, members: union.members?.map(transform) })

    const intersection = narrowSchema(schema, 'intersection')
    if (intersection) return createSchema({ ...intersection, members: intersection.members?.map(transform) })

    const ref = narrowSchema(schema, 'ref')
    if (ref) {
      const refName = resolveRefName(ref)
      if (!refName || !variantNames.has(refName)) return ref
      const renamed = variantName(refName, variant)
      return createSchema({
        ...ref,
        name: renamed,
        ref: ref.ref ? ref.ref.replace(/[^/]+$/, renamed) : ref.ref,
        schema: ref.schema ? transform(ref.schema) : ref.schema,
      })
    }

    return schema
  }

  return transform(node)
}
