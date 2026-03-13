import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * Schema name to `SchemaNode` mapping.
 */
export type RefMap = Map<string, SchemaNode>

/**
 * Indexes named schemas from `root.schemas` by name. Unnamed schemas are skipped.
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
 * Looks up a schema by name. Prefer over `RefMap.get()` to keep the resolution strategy swappable.
 */
export function resolveRef(refMap: RefMap, ref: string): SchemaNode | undefined {
  return refMap.get(ref)
}

/**
 * Converts a `RefMap` to a plain object.
 */
export function refMapToObject(refMap: RefMap): Record<string, SchemaNode> {
  return Object.fromEntries(refMap)
}
