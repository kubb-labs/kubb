import { memoize } from '@internals/utils'
import type { OperationNode, SchemaNode } from '../nodes/index.ts'
import { collect, collectLazy } from '../visitor.ts'
import { resolveRefName } from './refs.ts'

/**
 * Collects every named schema referenced (transitively) from a node via ref edges.
 *
 * Refs are followed by name only, the resolved `node.schema` is not traversed inline.
 * Use this to determine schema dependencies, build reference graphs, or detect what schemas need to be emitted.
 *
 * @example Collect refs from a single schema
 * ```ts
 * const names = collectReferencedSchemaNames(petSchema)
 * // → Set { 'Category', 'Tag' }
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
const collectSchemaRefs = memoize(new WeakMap<SchemaNode, ReadonlySet<string>>(), (node: SchemaNode): ReadonlySet<string> => {
  const refs = new Set<string>()
  collect<void>(node, {
    schema(child) {
      if (child.type === 'ref') {
        const name = resolveRefName(child)
        if (name) refs.add(name)
      }
    },
  })
  return refs
})

export function collectReferencedSchemaNames(node: SchemaNode | undefined, out: Set<string> = new Set()): Set<string> {
  if (!node) return out
  for (const name of collectSchemaRefs(node)) out.add(name)
  return out
}

/**
 * Collects the names of all top-level schemas transitively used by a set of operations.
 *
 * An operation uses a schema when any of its parameters, request body content, or responses
 * reference it, directly or indirectly through other named schemas.
 * The walk is iterative and safe against reference cycles.
 *
 * Use this together with `include` filters to determine which schemas from `components/schemas`
 * are reachable from the allowed operations, so that schemas used only by excluded operations
 * are not generated.
 *
 * @example Only generate schemas referenced by included operations
 * ```ts
 * const includedOps = operations.filter(op => resolver.resolveOptions(op, { options, include }) !== null)
 * const allowed = collectUsedSchemaNames(includedOps, schemas)
 *
 * for (const schema of schemas) {
 *   if (schema.name && !allowed.has(schema.name)) continue
 *   // … generate schema
 * }
 * ```
 *
 * @example Check whether a specific schema is needed
 * ```ts
 * const allowed = collectUsedSchemaNames(includedOps, schemas)
 * allowed.has('OrderStatus') // false when no included operation references OrderStatus
 * ```
 */
const collectUsedSchemaNamesMemo = memoize(new WeakMap<ReadonlyArray<OperationNode>, (schemas: ReadonlyArray<SchemaNode>) => Set<string>>(), (ops) =>
  memoize(new WeakMap<ReadonlyArray<SchemaNode>, Set<string>>(), (schemas) => computeUsedSchemaNames(ops, schemas)),
)

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
    for (const schema of collectLazy<SchemaNode>(op, { depth: 'shallow', schema: (node) => node })) {
      visitSchema(schema)
    }
  }

  return result
}

export function collectUsedSchemaNames(operations: ReadonlyArray<OperationNode>, schemas: ReadonlyArray<SchemaNode>): Set<string> {
  return collectUsedSchemaNamesMemo(operations)(schemas)
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
 * Identifies all schemas that participate in circular dependency chains, including direct self-loops.
 *
 * Returns a Set of schema names with circular dependencies. Use this to wrap recursive schema positions
 * in deferred constructs (lazy getter, `z.lazy(() => …)`) to prevent infinite recursion when generated code runs.
 * Refs are followed by name only, keeping the algorithm linear in the schema graph size.
 *
 * @note Call this once on the full schema graph, then use `containsCircularRef()` to check individual schemas.
 */
export function findCircularSchemas(schemas: ReadonlyArray<SchemaNode>): Set<string> {
  if (schemas.length === 0) return EMPTY_CIRCULAR_SET
  return findCircularSchemasMemo(schemas)
}

/**
 * Type guard returning `true` when a schema or anything nested within it contains a ref to a circular schema.
 *
 * Use `excludeName` to ignore refs to specific schemas (useful when self-references are handled separately).
 * Commonly used with `findCircularSchemas()` to detect where lazy wrappers are needed in code generation.
 *
 * @note Returns `true` for the first matching circular ref found. Use for fast dependency checks.
 */
export function containsCircularRef(
  node: SchemaNode | undefined,
  { circularSchemas, excludeName }: { circularSchemas: ReadonlySet<string>; excludeName?: string },
): boolean {
  if (!node || circularSchemas.size === 0) return false

  for (const _ of collectLazy<true>(node, {
    schema(child) {
      if (child.type !== 'ref') return null
      const name = resolveRefName(child)
      return name && name !== excludeName && circularSchemas.has(name) ? true : null
    },
  })) {
    return true
  }

  return false
}
