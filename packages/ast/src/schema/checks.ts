import type { ObjectSchemaNode, SchemaNode } from '../nodes/schema.ts'
import { getName, mergeSchema } from '../ref/index.ts'

/**
 * A check that runs on the raw input of a schema, named after its JSON Schema keyword.
 */
export type SchemaCheck =
  | { kind: 'minProperties'; value: number }
  | { kind: 'maxProperties'; value: number }
  | { kind: 'propertyNames'; schema: SchemaNode }
  | { kind: 'patternProperties'; patterns: Record<string, SchemaNode> }
  | ({ kind: 'conditional' } & NonNullable<SchemaNode['conditionals']>[number])

function hasTypedAdditionalProperties(node: ObjectSchemaNode): boolean {
  return Boolean(node.additionalProperties && node.additionalProperties !== true)
}

/**
 * The checks a schema needs on top of its shape, in the order validators apply them:
 * - `minProperties` and `maxProperties` for an object's property count
 * - `propertyNames` when the keys need their own check: on an object with `properties`, or a record keyed by
 *   `patternProperties` alone. A plain record already checks its keys.
 * - `patternProperties` when an object with `properties` and `additionalProperties: false` also takes keys that
 *   match a pattern, so its rest schema cannot check the keys
 * - one `conditional` per `if`/`then`/`else`, `dependentRequired` or `dependentSchemas` entry
 *
 * @example
 * ```ts
 * const checks = ast.schema.getChecks(node)
 * checks.length > 0 // the node has checks
 * ```
 */
export function getChecks(node: SchemaNode): Array<SchemaCheck> {
  const checks: Array<SchemaCheck> = []
  if (node.type === 'object') {
    if (node.min !== undefined) checks.push({ kind: 'minProperties', value: node.min })
    if (node.max !== undefined) checks.push({ kind: 'maxProperties', value: node.max })
    if (node.propertyNames && (node.properties.length > 0 || (Boolean(node.patternProperties) && !hasTypedAdditionalProperties(node)))) {
      checks.push({ kind: 'propertyNames', schema: node.propertyNames })
    }
    if (node.patternProperties && node.additionalProperties === false && node.properties.length > 0) {
      checks.push({ kind: 'patternProperties', patterns: node.patternProperties })
    }
  }
  for (const conditional of node.conditionals ?? []) checks.push({ kind: 'conditional', ...conditional })
  return checks
}

/**
 * The shape an object-like schema prints as, as {@link getObjectKind} returns it:
 * - `'properties'` fixed properties, or an empty object
 * - `'record'` no properties, with keys from `additionalProperties`, `patternProperties` or `propertyNames`
 * - `'composed'` an `allOf` of an object and plain inline objects, which merges into one object
 * - `'mixed'` fixed properties plus a typed `additionalProperties` or `patternProperties`
 */
export type ObjectKind = 'properties' | 'record' | 'composed' | 'mixed'

export type ObjectKindOptions = {
  /**
   * Names of the schemas in a ref cycle, from `ast.graph.getCircularNames`. A ref to one of them is not an object,
   * since it prints as a lazy reference.
   */
  circularSchemas?: ReadonlySet<string>
}

// A member an `allOf` can merge into its base: an object with properties only.
function isPlainInlineObject(node: SchemaNode): boolean {
  return (
    node.type === 'object' &&
    !node.nullable &&
    !node.optional &&
    !node.nullish &&
    node.additionalProperties === undefined &&
    !node.patternProperties &&
    !node.propertyNames &&
    getChecks(node).length === 0
  )
}

/**
 * The shape an object-like schema prints as, or `null` when it does not print as a plain object.
 *
 * A resolved ref gives the kind of its target, and an unresolved ref counts as `'properties'`. A single-member union
 * gives the kind of its member. A nullable or optional node, a node with input checks other than `patternProperties`,
 * and a ref into `circularSchemas` give `null`.
 *
 * @example
 * ```ts
 * switch (ast.schema.getObjectKind(node, { circularSchemas })) {
 *   case 'properties': // z.object
 *   case 'record':     // z.record
 *   case 'composed':   // one object from an allOf
 *   case 'mixed':      // z.object with a catchall
 * }
 * ```
 */
export function getObjectKind(node: SchemaNode, { circularSchemas }: ObjectKindOptions = {}): ObjectKind | null {
  if (node.nullable || node.optional || node.nullish) return null
  if (getChecks(node).some((check) => check.kind !== 'patternProperties')) return null

  if (node.type === 'object') {
    const hasProperties = node.properties.length > 0
    const hasRest = hasTypedAdditionalProperties(node) || Boolean(node.patternProperties)
    if (!hasProperties && (hasRest || node.propertyNames)) return 'record'
    return hasProperties && hasRest ? 'mixed' : 'properties'
  }

  if (node.type === 'ref') {
    const name = getName(node)
    if (name && circularSchemas?.has(name)) return null
    const resolved = mergeSchema(node)
    return resolved.type === 'ref' ? 'properties' : getObjectKind(resolved, { circularSchemas })
  }

  if (node.type === 'union') {
    return node.members?.length === 1 ? getObjectKind(node.members[0]!, { circularSchemas }) : null
  }

  if (node.type === 'intersection') {
    const [first, ...rest] = node.members ?? []
    if (!first || !rest.every(isPlainInlineObject)) return null
    const base = getObjectKind(first, { circularSchemas })
    return base && base !== 'record' ? 'composed' : null
  }

  return null
}
