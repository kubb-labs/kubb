import type { ObjectSchemaNode, SchemaNode } from '../nodes/schema.ts'
import { getName, mergeSchema } from '../ref/index.ts'

/** A check that runs on a schema's raw input, named after its JSON Schema keyword. */
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
 * The checks a schema runs on its raw input: property counts, a `propertyNames` check where a record does not already
 * check its keys, pattern keys of a closed object with properties, and each conditional.
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

/** `properties`, `record` (keys from a schema), `composed` (an `allOf` that merges into one object), or `mixed` (properties plus a typed rest). */
export type ObjectKind = 'properties' | 'record' | 'composed' | 'mixed'

export type ObjectKindOptions = {
  /** From `ast.graph.getCircularNames`. A ref to one of them gives `null`. */
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
 * The shape an object-like schema prints as, or `null`. Refs and single-member unions give their target's kind, and an
 * unresolved ref counts as `properties`. A nullable or optional node, or one with input checks, gives `null`.
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
