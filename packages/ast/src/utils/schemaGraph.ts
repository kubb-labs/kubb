import { memoize } from '@internals/utils'
import type { OperationNode } from '../nodes/operation.ts'
import type { SchemaNode } from '../nodes/schema.ts'
import { collect, collectSync } from '../visitor.ts'
import { resolveRefName } from './refs.ts'

type RefEntry = { name: string; hasPointer: boolean }

/**
 * Walks a node's subtree once and lists every ref it holds, in traversal order, as the resolved
 * name plus whether the ref carries a `$ref` pointer. Memoized by node identity, so
 * `collectSchemaRefs` and `collectImportedRefNames` share one scan per schema.
 */
const collectRefEntries = memoize(new WeakMap<SchemaNode, ReadonlyArray<RefEntry>>(), (node: SchemaNode): ReadonlyArray<RefEntry> =>
  collectSync<RefEntry>(node, {
    schema(child) {
      if (child.type !== 'ref') return undefined
      const name = resolveRefName(child)
      return name ? { name, hasPointer: Boolean(child.ref) } : undefined
    },
  }),
)

/**
 * Collects the names of every schema a node's subtree references, resolved with `resolveRefName`.
 * Each ref contributes its name only, so the schema it points to is never traversed. Memoized by
 * node identity, which lets `findCircularSchemas` and `containsCircularRef` share one scan per schema.
 *
 * @example
 * ```ts
 * collectSchemaRefs(petSchema)
 * // Set { 'Category', 'Tag' }
 * ```
 */
export const collectSchemaRefs = memoize(
  new WeakMap<SchemaNode, ReadonlySet<string>>(),
  (node: SchemaNode): ReadonlySet<string> => new Set(collectRefEntries(node).map((entry) => entry.name)),
)

/**
 * Collects the de-duplicated target names of every pointer-carrying ref in a node's subtree, in
 * first-occurrence order. Memoized by node identity, so `resolver.imports` reads the same result
 * across the ts, zod, and faker plugins instead of re-scanning the same schema per plugin.
 *
 * Only refs that carry a `$ref` pointer count, so a synthesized ref pointing at a sibling in the
 * same file (a union member created by name) is left out. That leaves exactly the set
 * `resolver.imports` emits.
 *
 * @example
 * ```ts
 * collectImportedRefNames(petSchema)
 * // ['Category', 'Tag']
 * ```
 */
export const collectImportedRefNames = memoize(new WeakMap<SchemaNode, ReadonlyArray<string>>(), (node: SchemaNode): ReadonlyArray<string> => [
  ...new Set(collectRefEntries(node).flatMap((entry) => (entry.hasPointer ? [entry.name] : []))),
])

/**
 * Collects the names of all top-level schemas transitively used by a set of operations.
 *
 * An operation uses a schema when its parameters, request body, or responses reference it, directly
 * or through other named schemas. Once a name is added to the result it is not revisited, so
 * reference cycles terminate.
 *
 * Pair it with `include` filters so schemas reachable only from excluded operations stay ungenerated.
 *
 * @example Only generate schemas referenced by included operations
 * ```ts
 * const includedOps = operations.filter((op) => resolver.default.options(op, { options, include }) !== null)
 * const allowed = collectUsedSchemaNames(includedOps, schemas)
 *
 * for (const schema of schemas) {
 *   if (schema.name && !allowed.has(schema.name)) continue
 *   // generate schema
 * }
 * ```
 */
export function collectUsedSchemaNames(operations: ReadonlyArray<OperationNode>, schemas: ReadonlyArray<SchemaNode>): Set<string> {
  const schemaMap = new Map<string, SchemaNode>()
  for (const schema of schemas) {
    if (schema.name) schemaMap.set(schema.name, schema)
  }

  const result = new Set<string>()

  function visitSchema(schema: SchemaNode): void {
    for (const name of collectSchemaRefs(schema)) {
      if (!result.has(name)) {
        result.add(name)
        const namedSchema = schemaMap.get(name)
        if (namedSchema) visitSchema(namedSchema)
      }
    }
  }

  for (const op of operations) {
    for (const schema of collect<SchemaNode>(op, { depth: 'shallow', schema: (node) => node })) {
      visitSchema(schema)
    }
  }

  return result
}

/**
 * Finds every schema that takes part in a circular dependency chain, including direct self-loops.
 *
 * Wrap the returned schema positions in a deferred construct (a lazy getter or `z.lazy(() => …)`) so
 * the generated code does not recurse forever. Refs are followed by name only, so the walk stays
 * linear in the size of the schema graph.
 *
 * @note Call this once on the full graph, then check individual schemas with `containsCircularRef()`.
 */
export function findCircularSchemas(schemas: ReadonlyArray<SchemaNode>): Set<string> {
  const graph = new Map<string, ReadonlySet<string>>()
  for (const schema of schemas) {
    if (schema.name) graph.set(schema.name, collectSchemaRefs(schema))
  }

  const circular = new Set<string>()
  for (const start of graph.keys()) {
    const visited = new Set<string>()
    const stack: Array<string> = [...(graph.get(start) ?? [])]
    while (stack.length > 0) {
      const node = stack.pop()!
      if (node === start) {
        circular.add(start)
        break
      }
      if (visited.has(node)) continue
      visited.add(node)

      const next = graph.get(node)
      if (next) for (const r of next) stack.push(r)
    }
  }

  return circular
}
