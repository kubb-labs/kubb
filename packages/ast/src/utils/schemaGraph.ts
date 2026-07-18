import { memoize } from '@internals/utils'
import type { OperationNode, SchemaNode } from '../nodes/index.ts'
import { collect, collectSync } from '../visitor.ts'
import { resolveRefName } from './refs.ts'

/**
 * Memoized inner pass that walks a single node and returns the names of every schema it references.
 */
const collectSchemaRefs = memoize(new WeakMap<SchemaNode, ReadonlySet<string>>(), (node: SchemaNode): ReadonlySet<string> => {
  const refs = new Set<string>()
  collectSync<void>(node, {
    schema(child) {
      if (child.type === 'ref') {
        const name = resolveRefName(child)
        if (name) refs.add(name)
      }
    },
  })
  return refs
})

/**
 * Collects the names of every ref found anywhere inside a node's own subtree.
 *
 * Each ref contributes its name only, so the schema it points to is never traversed here. Pass `out`
 * to accumulate names from several nodes into one set.
 *
 * @example Collect refs from a single schema
 * ```ts
 * const names = collectReferencedSchemaNames(petSchema)
 * // Set { 'Category', 'Tag' }
 * ```
 *
 * @example Accumulate refs from multiple schemas into one set
 * ```ts
 * const out = new Set<string>()
 * for (const schema of schemas) {
 *   collectReferencedSchemaNames(schema, out)
 * }
 * ```
 */
export function collectReferencedSchemaNames(node: SchemaNode | undefined, out: Set<string> = new Set()): Set<string> {
  if (!node) return out
  for (const name of collectSchemaRefs(node)) out.add(name)
  return out
}

/**
 * Collects the de-duplicated target names of every pointer-carrying ref in a node's subtree, in
 * first-occurrence order. The walk is memoized by node identity, so the subtree is scanned once and
 * `resolver.imports` reads the same result across the ts, zod, and faker plugins instead of
 * re-scanning the same schema per plugin.
 *
 * Only refs that carry a `$ref` pointer count, so a synthesized ref pointing at a sibling in the
 * same file (a union member created by name) is left out. That leaves exactly the set
 * `resolver.imports` emits. This is the ordered, import-facing counterpart to
 * {@link collectReferencedSchemaNames}, which returns an unordered set for graph analysis.
 *
 * @example
 * ```ts
 * collectImportedRefNames(petSchema)
 * // ['Category', 'Tag']
 * ```
 */
export const collectImportedRefNames = memoize(new WeakMap<SchemaNode, ReadonlyArray<string>>(), (node: SchemaNode): ReadonlyArray<string> => {
  const seen = new Set<string>()
  const names: Array<string> = []
  collectSync<void>(node, {
    schema(child) {
      if (child.type !== 'ref' || !child.ref) return
      const name = resolveRefName(child)
      if (name && !seen.has(name)) {
        seen.add(name)
        names.push(name)
      }
    },
  })
  return names
})

function computeUsedSchemaNames(operations: ReadonlyArray<OperationNode>, schemas: ReadonlyArray<SchemaNode>): Set<string> {
  const schemaMap = new Map<string, SchemaNode>()
  for (const schema of schemas) {
    if (schema.name) schemaMap.set(schema.name, schema)
  }

  const result = new Set<string>()

  function visitSchema(schema: SchemaNode): void {
    const directRefs = collectReferencedSchemaNames(schema)
    for (const name of directRefs) {
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
  return computeUsedSchemaNames(operations, schemas)
}

const EMPTY_CIRCULAR_SET = new Set<string>()

const findCircularSchemasMemo = memoize(new WeakMap<ReadonlyArray<SchemaNode>, Set<string>>(), (schemas: ReadonlyArray<SchemaNode>): Set<string> => {
  const graph = new Map<string, Set<string>>()

  for (const schema of schemas) {
    if (!schema.name) continue
    graph.set(schema.name, collectReferencedSchemaNames(schema))
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
})

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
  if (schemas.length === 0) return EMPTY_CIRCULAR_SET

  return findCircularSchemasMemo(schemas)
}
