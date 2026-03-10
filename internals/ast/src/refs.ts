import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * A map from schema name to its `SchemaNode` definition.
 *
 * Built once with `buildRefMap`, queried with `resolveRef`.
 *
 * @example
 * ```ts
 * const refMap = buildRefMap(root)
 * const pet = resolveRef(refMap, 'Pet') // SchemaNode | undefined
 * ```
 */
export type RefMap = Map<string, SchemaNode>

/**
 * Build a `RefMap` from a `RootNode`.
 *
 * Indexes every named schema in `root.schemas` by its `name` property.
 * Unnamed (inline) schemas are skipped.
 */
export function buildRefMap(root: RootNode): RefMap {
  const map: RefMap = new Map()
  for (const schema of root.schemas) {
    if (schema.name) {
      map.set(schema.name, schema)
    }
  }
  return map
}

/**
 * Resolve a ref string to its `SchemaNode`, or `undefined` when the ref
 * is not present in the map (e.g. an external or unknown reference).
 *
 * @example
 * ```ts
 * const schema = resolveRef(refMap, 'Pet')
 * if (schema) { /* use schema *\/ }
 * ```
 */
export function resolveRef(refMap: RefMap, ref: string): SchemaNode | undefined {
  return refMap.get(ref)
}

/**
 * Serialize a `RefMap` to a plain `Record` so it can be passed to
 * `JSON.stringify`, logged, or spread into another object.
 *
 * @example
 * ```ts
 * console.log(JSON.stringify(refMapToObject(refMap), null, 2))
 * ```
 */
export function refMapToObject(refMap: RefMap): Record<string, SchemaNode> {
  return Object.fromEntries(refMap)
}
