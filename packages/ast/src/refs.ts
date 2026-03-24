import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'

/**
 * Lookup map from schema name to `SchemaNode`.
 */
export type RefMap = Map<string, SchemaNode>

/**
 * Returns the last path segment of a reference string.
 *
 * Example: `#/components/schemas/Pet` becomes `Pet`.
 *
 * @example
 * ```ts
 * extractRefName('#/components/schemas/Pet') // 'Pet'
 * ```
 */
export function extractRefName(ref: string): string {
  return ref.split('/').at(-1) ?? ref
}

/**
 * Builds a `RefMap` from `root.schemas` using each schema's `name`.
 *
 * Unnamed schemas are skipped.
 *
 * @example
 * ```ts
 * const refMap = buildRefMap(root)
 * const pet = refMap.get('Pet')
 * ```
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
 * Resolves a schema by name from a `RefMap`.
 *
 * @example
 * ```ts
 * const petSchema = resolveRef(refMap, 'Pet')
 * ```
 */
export function resolveRef(refMap: RefMap, ref: string): SchemaNode | undefined {
  return refMap.get(ref)
}

/**
 * Converts a `RefMap` into a plain object.
 *
 * @example
 * ```ts
 * const refsObject = refMapToObject(refMap)
 * ```
 */
export function refMapToObject(refMap: RefMap): Record<string, SchemaNode> {
  return Object.fromEntries(refMap)
}
