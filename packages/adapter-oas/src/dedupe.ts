import { containsCircularRef, extractRefName } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import { SCHEMA_REF_PREFIX } from './constants.ts'

/**
 * The destination a deduplicated shape points at: the shared schema name and the
 * synthetic `$ref` path stored on the generated `ref` nodes.
 */
export type DedupeTarget = {
  /**
   * Shared schema name every duplicate occurrence refers to.
   */
  name: string
  /**
   * `$ref` path stored on the generated `ref` nodes (for example `#/components/schemas/Status`).
   */
  ref: string
}

/**
 * The result of {@link plan}: a lookup from structural signature to its shared target,
 * plus the freshly extracted definitions that must be added to the schema list.
 */
export type DedupePlan = {
  /**
   * Maps a structural signature to the shared schema that represents it.
   */
  targetBySignature: Map<string, DedupeTarget>
  /**
   * Maps the name of a top-level schema that duplicates a shared one to that target, so
   * references to the duplicate can be repointed at the first schema with the same content.
   */
  targetByName: Map<string, DedupeTarget>
  /**
   * New top-level schema definitions created for inline shapes that had no existing
   * named component. Nested duplicates inside each definition are already collapsed.
   */
  extracted: Array<ast.SchemaNode>
}

/**
 * The lookups {@link apply} needs from a {@link DedupePlan}.
 */
export type DedupeLookups = Pick<DedupePlan, 'targetBySignature' | 'targetByName'>

/**
 * Runtime state {@link plan} reads from the current parse: schema names that take part in a
 * circular chain (never extracted, extracting them would break the cycle) and the names already in
 * use (so extracted definitions resolve collisions).
 */
export type DedupeContext = {
  circularSchemas: ReadonlySet<string>
  usedNames: Set<string>
}

/**
 * Minimum occurrences before a shape is deduplicated.
 */
const MIN_OCCURRENCES = 2

/**
 * Builds the shared `ref` replacement for a duplicate occurrence, carrying the
 * usage-slot and documentation fields that are not part of the shared type.
 */
function createRefNode(node: ast.SchemaNode, target: DedupeTarget): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'ref',
    name: target.name,
    ref: target.ref,
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
 * Rewrites a node, replacing every candidate sub-schema whose signature has a shared
 * target with a `ref` to that target. Replacing a node with a `ref` prunes its subtree,
 * so nested duplicates inside a replaced shape are not visited again. A `ref` that points
 * at a duplicate top-level schema (see `targetByName`) is repointed at the first schema with
 * the same content.
 *
 * Pass `skipRootMatch` when rewriting a shared definition so its own root is not
 * turned into a reference to itself. Nested duplicates are still collapsed.
 *
 * @example
 * ```ts
 * const next = apply(operationNode, plan)
 * ```
 */
export function apply<T extends ast.Node>(node: T, plan: DedupeLookups, skipRootMatch = false): T {
  const { targetBySignature, targetByName } = plan
  if (targetBySignature.size === 0 && targetByName.size === 0) return node

  const root = node

  return ast.transform(node, {
    schema(schemaNode) {
      if (schemaNode.type === 'ref') {
        const refName = schemaNode.ref ? extractRefName(schemaNode.ref) : schemaNode.name
        const target = refName ? targetByName.get(refName) : undefined

        return target ? { ...schemaNode, name: target.name, ref: target.ref } : undefined
      }

      const signature = ast.signatureOf(schemaNode)
      if (skipRootMatch && schemaNode === root) return undefined

      const target = targetBySignature.get(signature)
      if (!target) return undefined

      return createRefNode(schemaNode, target)
    },
  }) as T
}

/**
 * Strips usage-slot flags from an extracted definition and applies its name.
 * A standalone definition is never optional, so `optional`/`nullish` are cleared.
 */
function cleanDefinition(node: ast.SchemaNode, name: string): ast.SchemaNode {
  return { ...node, name, optional: undefined, nullish: undefined }
}

/**
 * Returns `true` when a node is eligible for deduplication. Only enums and objects qualify, and
 * object shapes that take part in a circular chain are rejected so recursive structures are not
 * extracted (which would break the cycle).
 */
function isCandidate(node: ast.SchemaNode, circularSchemas: ReadonlySet<string>): boolean {
  if (node.type === 'enum') return true
  if (node.type !== 'object') return false
  if (node.name && circularSchemas.has(node.name)) return false
  return !containsCircularRef(node, { circularSchemas })
}

/**
 * Produces the name for an inline shape with no existing named component, resolving
 * collisions against `usedNames`. Returns `null` for an unnamed shape, which stays inline.
 */
function nameFor(node: ast.SchemaNode, usedNames: Set<string>): string | null {
  const base = node.name
  if (!base) return null

  let name = base
  let counter = 2
  while (usedNames.has(name)) {
    name = `${base}${counter++}`
  }
  usedNames.add(name)
  return name
}

/**
 * Scans a forest of schema and operation nodes and produces a {@link DedupePlan}.
 *
 * A shape that occurs at least {@link MIN_OCCURRENCES} times is deduplicated: if any occurrence is
 * a named top-level schema, the first one becomes the target (so other top-level duplicates and
 * inline copies turn into references to it). Every other top-level name with the same content is
 * recorded in `targetByName`, so refs to it can be repointed at the target. Otherwise a new
 * definition is extracted using {@link nameFor}. The plan is then applied per node with {@link apply}.
 *
 * @example
 * ```ts
 * const dedupePlan = plan([...schemaNodes, ...operationNodes], { circularSchemas, usedNames })
 * ```
 */
export function plan(roots: ReadonlyArray<ast.Node>, context: DedupeContext): DedupePlan {
  const { circularSchemas, usedNames } = context

  const topLevelNodes = new Set<ast.SchemaNode>()

  type Group = {
    count: number
    representative: ast.SchemaNode
    topLevelNames: Array<string>
  }
  const groups = new Map<string, Group>()

  function record(schemaNode: ast.SchemaNode): void {
    if (!isCandidate(schemaNode, circularSchemas)) return
    const signature = ast.signatureOf(schemaNode)

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
    for (const schemaNode of ast.collect<ast.SchemaNode>(root, { schema: (node) => node })) {
      record(schemaNode)
    }
  }

  const targetBySignature = new Map<string, DedupeTarget>()
  const targetByName = new Map<string, DedupeTarget>()
  const pendingExtractions: Array<{ name: string; representative: ast.SchemaNode }> = []

  for (const [signature, group] of groups) {
    if (group.count < MIN_OCCURRENCES) continue

    const [firstName, ...duplicateNames] = group.topLevelNames
    if (firstName) {
      const target: DedupeTarget = { name: firstName, ref: `${SCHEMA_REF_PREFIX}${firstName}` }
      targetBySignature.set(signature, target)
      for (const duplicate of duplicateNames) {
        targetByName.set(duplicate, target)
      }
      continue
    }

    const name = nameFor(group.representative, usedNames)
    if (!name) continue

    targetBySignature.set(signature, { name, ref: `${SCHEMA_REF_PREFIX}${name}` })
    pendingExtractions.push({ name, representative: group.representative })
  }

  // Build extracted definitions only after every target name is known, so nested
  // duplicates inside a definition also resolve to refs.
  const extracted = pendingExtractions.map(({ name, representative }) =>
    cleanDefinition(apply(representative, { targetBySignature, targetByName }, true), name),
  )

  return { targetBySignature, targetByName, extracted }
}
