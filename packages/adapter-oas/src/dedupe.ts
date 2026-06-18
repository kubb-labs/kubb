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
 * The result of {@link plan}: the shared definitions to prepend to the schema list, plus the
 * rewriting behavior that repoints duplicate shapes at their shared target. The lookup maps stay
 * private to the closure, so callers interact with one object instead of three collections.
 */
export type Plan = {
  /**
   * New top-level schema definitions created for inline shapes that had no existing named
   * component. Nested duplicates inside each definition are already collapsed.
   */
  extracted: Array<ast.SchemaNode>
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
 * circular chain (never extracted, extracting them would break the cycle) and the names already in
 * use (so extracted definitions resolve collisions).
 */
export type DedupeContext = {
  circularSchemas: ReadonlySet<string>
  usedNames: Set<string>
  /**
   * Names an operation already claims for a generated type (its response-status, data, and
   * parameter types). An inline shape with no named component falls back to its parser-assigned
   * name, which for an operation body is one of these. Extracting it under that name would clash
   * with the operation's own type, so such a shape is left inline instead of hoisted.
   */
  reservedNames?: ReadonlySet<string>
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
 * Scans a forest of schema and operation nodes and produces a {@link Plan}.
 *
 * A shape that occurs at least {@link MIN_OCCURRENCES} times is deduplicated: if any occurrence is
 * a named top-level schema, the first one becomes the target (so other top-level duplicates and
 * inline copies turn into references to it). Other top-level names with the same content are
 * recorded as aliases. Otherwise a new definition is extracted using {@link nameFor}. The returned
 * plan rewrites nodes against those decisions.
 *
 * @example
 * ```ts
 * const dedupePlan = plan([...schemaNodes, ...operationNodes], { circularSchemas, usedNames })
 * ```
 */
export function plan(roots: ReadonlyArray<ast.Node>, context: DedupeContext): Plan {
  const { circularSchemas, usedNames, reservedNames = new Set<string>() } = context

  const topLevelNodes = new Set<ast.SchemaNode>()

  type Group = {
    count: number
    representative: ast.SchemaNode
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
        groups.set(signature, { count: 1, representative: schemaNode, topLevelNames: isTopLevel ? [schemaNode.name!] : [] })
      }
    }
  }

  const bySignature = new Map<string, Target>()
  const byName = new Map<string, Target>()
  const pendingExtractions: Array<{ name: string; representative: ast.SchemaNode }> = []

  for (const [signature, group] of groups) {
    if (group.count < MIN_OCCURRENCES) continue

    const [firstName, ...duplicateNames] = group.topLevelNames
    if (firstName) {
      const target: Target = { name: firstName, ref: `${SCHEMA_REF_PREFIX}${firstName}` }
      bySignature.set(signature, target)
      for (const duplicate of duplicateNames) {
        byName.set(duplicate, target)
      }
      continue
    }

    // No named component backs this shape, so it would be extracted under its parser-assigned
    // name. When an operation already claims that name for one of its own types, keep the shape
    // inline rather than emit a colliding shared definition.
    if (group.representative.name && reservedNames.has(group.representative.name)) continue

    const name = nameFor(group.representative, usedNames)
    if (!name) continue

    bySignature.set(signature, { name, ref: `${SCHEMA_REF_PREFIX}${name}` })
    pendingExtractions.push({ name, representative: group.representative })
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

  // Build extracted definitions only after every target name is known, so nested
  // duplicates inside a definition also resolve to refs.
  const extracted = pendingExtractions.map(({ name, representative }) => cleanDefinition(rewrite(representative, true), name))

  return {
    extracted,
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
