import { createSchema } from './factory.ts'
import type { Node, OperationNode, SchemaNode } from './nodes/index.ts'
import { signatureOf } from './signature.ts'
import { collectLazy, transform } from './visitor.ts'

/**
 * A canonical destination for a deduplicated shape: the shared schema name and
 * the synthetic `$ref` path that points at it.
 */
export type DedupeCanonical = {
  /**
   * Canonical schema name every duplicate occurrence refers to.
   */
  name: string
  /**
   * `$ref` path stored on the generated `ref` nodes (for example `#/components/schemas/Status`).
   */
  ref: string
}

/**
 * The result of {@link buildDedupePlan}: a lookup from structural signature to its
 * canonical target, plus the freshly hoisted definitions that must be added to
 * the schema list.
 */
export type DedupePlan = {
  /**
   * Maps a structural signature to the canonical schema that represents it.
   */
  canonicalBySignature: Map<string, DedupeCanonical>
  /**
   * New top-level schema definitions created for inline shapes that had no existing
   * named component. Nested duplicates inside each definition are already collapsed.
   */
  hoisted: Array<SchemaNode>
}

/**
 * Options that inject the naming and candidate policy into {@link buildDedupePlan}.
 * The mechanics (grouping, counting, rewriting) live here; the policy lives in the caller.
 */
export type BuildDedupePlanOptions = {
  /**
   * Returns `true` when a node should be deduplicated. This is the only gate, so it must
   * reject both ineligible kinds (return `false` for anything other than, say, enums and
   * objects) and unsafe shapes (e.g. nodes that reference a circular schema).
   */
  isCandidate: (node: SchemaNode) => boolean
  /**
   * Produces the canonical name for an inline shape with no existing named component.
   * Return `null` to leave the shape inline (for example when no contextual name exists).
   */
  nameFor: (node: SchemaNode, signature: string) => string | null
  /**
   * Builds the `$ref` path for a canonical name.
   */
  refFor: (name: string) => string
  /**
   * Minimum number of occurrences before a shape is deduplicated.
   *
   * @default 2
   */
  minOccurrences?: number
}

/**
 * Builds the shared `ref` replacement for a duplicate occurrence, carrying the
 * usage-slot and documentation fields that are not part of the canonical type.
 */
function createRefNode(node: SchemaNode, canonical: DedupeCanonical): SchemaNode {
  return createSchema({
    type: 'ref',
    name: canonical.name,
    ref: canonical.ref,
    optional: node.optional,
    nullish: node.nullish,
    readOnly: node.readOnly,
    writeOnly: node.writeOnly,
    deprecated: node.deprecated,
    description: node.description,
    default: node.default,
    example: node.example,
  })
}

/**
 * Rewrites a node, replacing every candidate sub-schema whose signature has a canonical
 * target with a `ref` to that target. Replacing a node with a `ref` prunes its subtree,
 * so nested duplicates inside a replaced shape are not visited again.
 *
 * Pass `skipRootMatch` when rewriting a canonical definition so its own root is not
 * turned into a reference to itself; nested duplicates are still collapsed.
 *
 * @example
 * ```ts
 * const next = applyDedupe(operationNode, plan.canonicalBySignature)
 * ```
 */
export function applyDedupe(node: SchemaNode, canonicalBySignature: ReadonlyMap<string, DedupeCanonical>, skipRootMatch?: boolean): SchemaNode
export function applyDedupe(node: OperationNode, canonicalBySignature: ReadonlyMap<string, DedupeCanonical>, skipRootMatch?: boolean): OperationNode
export function applyDedupe(node: Node, canonicalBySignature: ReadonlyMap<string, DedupeCanonical>, skipRootMatch = false): Node {
  if (canonicalBySignature.size === 0) return node

  const signatures = new Map<SchemaNode, string>()
  const root = node

  return transform(node, {
    schema(schemaNode) {
      const signature = signatureOf(schemaNode, signatures)
      if (skipRootMatch && schemaNode === root) return undefined

      const canonical = canonicalBySignature.get(signature)
      if (!canonical) return undefined

      return createRefNode(schemaNode, canonical)
    },
  })
}

/**
 * Strips usage-slot flags from a hoisted definition and applies its canonical name.
 * A standalone definition is never optional, so `optional`/`nullish` are cleared.
 */
function cleanDefinition(node: SchemaNode, name: string): SchemaNode {
  return { ...node, name, optional: undefined, nullish: undefined }
}

/**
 * Scans a forest of schema and operation nodes and produces a {@link DedupePlan}.
 *
 * A shape that occurs at least `minOccurrences` times is deduplicated: if any occurrence
 * is a named top-level schema, that name becomes the canonical (so other top-level duplicates
 * and inline copies turn into references to it); otherwise a new definition is hoisted using
 * `nameFor`. The plan is then applied per node with {@link applyDedupe}.
 *
 * @example
 * ```ts
 * const plan = buildDedupePlan([...schemaNodes, ...operationNodes], {
 *   isCandidate: (node) => node.type === 'enum' || node.type === 'object',
 *   nameFor: (node) => node.name ?? null,
 *   refFor: (name) => `#/components/schemas/${name}`,
 * })
 * ```
 */
export function buildDedupePlan(roots: ReadonlyArray<Node>, options: BuildDedupePlanOptions): DedupePlan {
  const { isCandidate, nameFor, refFor, minOccurrences = 2 } = options

  const signatures = new Map<SchemaNode, string>()
  const topLevelNodes = new Set<SchemaNode>()

  type Group = {
    count: number
    representative: SchemaNode
    topLevelName?: string
  }
  const groups = new Map<string, Group>()

  function record(schemaNode: SchemaNode): void {
    const signature = signatureOf(schemaNode, signatures)
    if (!isCandidate(schemaNode)) return

    const isTopLevel = topLevelNodes.has(schemaNode) && !!schemaNode.name
    const group = groups.get(signature)
    if (group) {
      group.count++
      if (isTopLevel && !group.topLevelName) group.topLevelName = schemaNode.name!
    } else {
      groups.set(signature, { count: 1, representative: schemaNode, topLevelName: isTopLevel ? schemaNode.name! : undefined })
    }
  }

  for (const root of roots) {
    if (root.kind === 'Schema') topLevelNodes.add(root)
    for (const schemaNode of collectLazy<SchemaNode>(root, { schema: (node) => node })) {
      record(schemaNode)
    }
  }

  const canonicalBySignature = new Map<string, DedupeCanonical>()
  const pendingHoists: Array<{ name: string; representative: SchemaNode }> = []

  for (const [signature, group] of groups) {
    if (group.count < minOccurrences) continue

    if (group.topLevelName) {
      canonicalBySignature.set(signature, { name: group.topLevelName, ref: refFor(group.topLevelName) })
      continue
    }

    const name = nameFor(group.representative, signature)
    if (!name) continue

    canonicalBySignature.set(signature, { name, ref: refFor(name) })
    pendingHoists.push({ name, representative: group.representative })
  }

  // Build hoisted definitions only after every canonical name is known, so nested
  // duplicates inside a definition also resolve to refs.
  const hoisted = pendingHoists.map(({ name, representative }) => cleanDefinition(applyDedupe(representative, canonicalBySignature, true), name))

  return { canonicalBySignature, hoisted }
}
