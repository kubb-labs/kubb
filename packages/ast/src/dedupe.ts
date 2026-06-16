/**
 * Schema-shape deduplication. `buildDedupePlan` finds top-level and inline schemas that share a
 * structural signature, picks one canonical definition, and `applyDedupe` repoints every duplicate
 * at it. This works on `SchemaNode` content, not on files.
 *
 * For merging a file's imports, exports, and source nodes, see `utils/fileMerge.ts`. Same idea of
 * collapsing duplicates, but a different domain.
 */
import type { Node, OperationNode, SchemaNode } from './nodes/index.ts'
import { createSchema } from './nodes/schema.ts'
import { signatureOf } from './signature.ts'
import { extractRefName } from './utils/index.ts'
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
   * Maps the name of a top-level schema that duplicates a canonical one to that canonical, so
   * references to the duplicate can be repointed at the first schema with the same content.
   */
  aliasNames: Map<string, DedupeCanonical>
  /**
   * New top-level schema definitions created for inline shapes that had no existing
   * named component. Nested duplicates inside each definition are already collapsed.
   */
  hoisted: Array<SchemaNode>
}

/**
 * The lookups {@link applyDedupe} needs from a {@link DedupePlan}.
 */
export type DedupeLookups = Pick<DedupePlan, 'canonicalBySignature' | 'aliasNames'>

/**
 * Options that inject the naming and candidate policy into {@link buildDedupePlan}.
 * The mechanics (grouping, counting, rewriting) live here. The policy lives in the caller.
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
 * so nested duplicates inside a replaced shape are not visited again. A `ref` that points
 * at a duplicate top-level schema (see `aliasNames`) is repointed at the first schema with
 * the same content.
 *
 * Pass `skipRootMatch` when rewriting a canonical definition so its own root is not
 * turned into a reference to itself. Nested duplicates are still collapsed.
 *
 * @example
 * ```ts
 * const next = applyDedupe(operationNode, plan)
 * ```
 */
export function applyDedupe(node: SchemaNode, plan: DedupeLookups, skipRootMatch?: boolean): SchemaNode
export function applyDedupe(node: OperationNode, plan: DedupeLookups, skipRootMatch?: boolean): OperationNode
export function applyDedupe(node: Node, plan: DedupeLookups, skipRootMatch = false): Node {
  const { canonicalBySignature, aliasNames } = plan
  if (canonicalBySignature.size === 0 && aliasNames.size === 0) return node

  const root = node

  return transform(node, {
    schema(schemaNode) {
      if (schemaNode.type === 'ref') {
        const target = schemaNode.ref ? extractRefName(schemaNode.ref) : schemaNode.name
        const canonical = target ? aliasNames.get(target) : undefined

        return canonical ? { ...schemaNode, name: canonical.name, ref: canonical.ref } : undefined
      }

      const signature = signatureOf(schemaNode)
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
 * is a named top-level schema, the first one becomes the canonical (so other top-level
 * duplicates and inline copies turn into references to it). Every other top-level name with
 * the same content is recorded in `aliasNames`, so refs to it can be repointed at the
 * canonical. Otherwise a new definition is hoisted using `nameFor`. The plan is then applied
 * per node with {@link applyDedupe}.
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

  const topLevelNodes = new Set<SchemaNode>()

  type Group = {
    count: number
    representative: SchemaNode
    topLevelNames: Array<string>
  }
  const groups = new Map<string, Group>()

  function record(schemaNode: SchemaNode): void {
    if (!isCandidate(schemaNode)) return
    const signature = signatureOf(schemaNode)

    const isTopLevel = topLevelNodes.has(schemaNode) && !!schemaNode.name
    const group = groups.get(signature)
    if (group) {
      group.count++
      if (isTopLevel) group.topLevelNames.push(schemaNode.name!)
    } else {
      groups.set(signature, { count: 1, representative: schemaNode, topLevelNames: isTopLevel ? [schemaNode.name!] : [] })
    }
  }

  for (const root of roots) {
    if (root.kind === 'Schema') topLevelNodes.add(root)
    for (const schemaNode of collectLazy<SchemaNode>(root, { schema: (node) => node })) {
      record(schemaNode)
    }
  }

  const canonicalBySignature = new Map<string, DedupeCanonical>()
  const aliasNames = new Map<string, DedupeCanonical>()
  const pendingHoists: Array<{ name: string; representative: SchemaNode }> = []

  for (const [signature, group] of groups) {
    if (group.count < minOccurrences) continue

    const [firstName, ...duplicateNames] = group.topLevelNames
    if (firstName) {
      const canonical: DedupeCanonical = { name: firstName, ref: refFor(firstName) }
      canonicalBySignature.set(signature, canonical)
      for (const duplicate of duplicateNames) {
        aliasNames.set(duplicate, canonical)
      }
      continue
    }

    const name = nameFor(group.representative, signature)
    if (!name) continue

    canonicalBySignature.set(signature, { name, ref: refFor(name) })
    pendingHoists.push({ name, representative: group.representative })
  }

  // Build hoisted definitions only after every canonical name is known, so nested
  // duplicates inside a definition also resolve to refs.
  const hoisted = pendingHoists.map(({ name, representative }) =>
    cleanDefinition(applyDedupe(representative, { canonicalBySignature, aliasNames }, true), name),
  )

  return { canonicalBySignature, aliasNames, hoisted }
}
