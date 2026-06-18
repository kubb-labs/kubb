import { containsCircularRef, extractRefName } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import { SCHEMA_REF_PREFIX } from './constants.ts'

/**
 * The destination a deduplicated shape points at: the shared schema name and the
 * synthetic `$ref` path stored on the generated `ref` nodes.
 */
type Target = {
  name: string
  ref: string
}

/**
 * The result of {@link plan}: the rewriting behavior that repoints duplicate shapes at their
 * shared target. The lookup maps stay private to the closure, so callers interact with one object
 * instead of several collections.
 */
export type Plan = {
  /**
   * Rewrites an operation or nested schema, replacing every duplicate sub-schema with a `ref` to
   * its shared target. Replacing a node prunes its subtree, so nested duplicates inside a replaced
   * shape are not visited again. A `ref` to a duplicate top-level schema is repointed at the first
   * schema with the same content.
   */
  apply<T extends ast.Node>(node: T): T
  /**
   * Rewrites a top-level schema. A schema whose content duplicates a different shared one becomes a
   * `ref` alias to it (keeping its own name and docs). Otherwise its nested duplicates collapse
   * while its own root is preserved.
   */
  applyTopLevel(node: ast.SchemaNode): ast.SchemaNode
  /**
   * Whether a top-level name duplicates an earlier schema with the same content. Such a schema is
   * never emitted, since every reference to it is repointed at the first schema with that content.
   */
  isAlias(name: string): boolean
}

/**
 * Runtime state {@link plan} reads from the current parse: schema names that take part in a
 * circular chain. These are never deduplicated, since collapsing them would break the cycle.
 */
export type DedupeContext = {
  circularSchemas: ReadonlySet<string>
}

/**
 * Minimum occurrences before a shape is deduplicated.
 */
const MIN_OCCURRENCES = 2

/**
 * Builds the shared `ref` replacement for a duplicate occurrence, carrying the
 * usage-slot and documentation fields that are not part of the shared type.
 */
function createRefNode(node: ast.SchemaNode, target: Target): ast.SchemaNode {
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
    examples: node.examples,
  })
}

/**
 * Returns `true` when a node is eligible for deduplication. Only enums and objects qualify, and
 * object shapes that take part in a circular chain are rejected so recursive structures are not
 * collapsed (which would break the cycle).
 */
function isCandidate(node: ast.SchemaNode, circularSchemas: ReadonlySet<string>): boolean {
  if (node.type === 'enum') return true
  if (node.type !== 'object') return false
  if (node.name && circularSchemas.has(node.name)) return false
  return !containsCircularRef(node, { circularSchemas })
}

/**
 * Scans a forest of schema and operation nodes and produces a {@link Plan}.
 *
 * A shape that occurs at least {@link MIN_OCCURRENCES} times and is backed by a named top-level
 * schema is deduplicated: the first named occurrence becomes the target, so other top-level
 * duplicates and inline copies turn into references to it. Other top-level names with the same
 * content are recorded as aliases. Inline shapes with no named component are left in place — they
 * are only collapsed when they match a schema the spec already names.
 *
 * @example
 * ```ts
 * const dedupePlan = plan([...schemaNodes, ...operationNodes], { circularSchemas })
 * ```
 */
export function plan(roots: ReadonlyArray<ast.Node>, context: DedupeContext): Plan {
  const { circularSchemas } = context

  const topLevelNodes = new Set<ast.SchemaNode>()

  type Group = {
    count: number
    topLevelNames: Array<string>
  }
  const groups = new Map<string, Group>()

  for (const root of roots) {
    if (root.kind === 'Schema') topLevelNodes.add(root)
    for (const schemaNode of ast.collect<ast.SchemaNode>(root, { schema: (node) => node })) {
      if (!isCandidate(schemaNode, circularSchemas)) continue

      const signature = ast.signatureOf(schemaNode)
      const isTopLevel = topLevelNodes.has(schemaNode) && !!schemaNode.name
      const group = groups.get(signature)
      if (group) {
        group.count++
        if (isTopLevel) group.topLevelNames.push(schemaNode.name!)
      } else {
        groups.set(signature, { count: 1, topLevelNames: isTopLevel ? [schemaNode.name!] : [] })
      }
    }
  }

  const bySignature = new Map<string, Target>()
  const byName = new Map<string, Target>()

  for (const [signature, group] of groups) {
    if (group.count < MIN_OCCURRENCES) continue

    // Only collapse shapes the spec already names. An inline shape with no named component is
    // left in place rather than hoisted under an invented name.
    const [firstName, ...duplicateNames] = group.topLevelNames
    if (!firstName) continue

    const target: Target = { name: firstName, ref: `${SCHEMA_REF_PREFIX}${firstName}` }
    bySignature.set(signature, target)
    for (const duplicate of duplicateNames) {
      byName.set(duplicate, target)
    }
  }

  // Rewrites a node against the resolved targets. `skipRootMatch` keeps a definition's own root from
  // turning into a reference to itself. Nested duplicates are still collapsed.
  function rewrite<T extends ast.Node>(node: T, skipRootMatch: boolean): T {
    if (bySignature.size === 0 && byName.size === 0) return node

    const root = node

    return ast.transform(node, {
      schema(schemaNode) {
        if (schemaNode.type === 'ref') {
          const refName = schemaNode.ref ? extractRefName(schemaNode.ref) : schemaNode.name
          const target = refName ? byName.get(refName) : undefined

          return target ? { ...schemaNode, name: target.name, ref: target.ref } : undefined
        }

        if (skipRootMatch && schemaNode === root) return undefined

        const target = bySignature.get(ast.signatureOf(schemaNode))
        if (!target) return undefined

        return createRefNode(schemaNode, target)
      },
    }) as T
  }

  return {
    apply<T extends ast.Node>(node: T): T {
      return rewrite(node, false)
    },
    applyTopLevel(node: ast.SchemaNode): ast.SchemaNode {
      const target = bySignature.get(ast.signatureOf(node))
      if (target && target.name !== node.name) {
        return ast.factory.createSchema({
          type: 'ref',
          name: node.name ?? null,
          ref: target.ref,
          description: node.description,
          deprecated: node.deprecated,
        })
      }

      return rewrite(node, true)
    },
    isAlias(name: string): boolean {
      return byName.has(name)
    },
  }
}
