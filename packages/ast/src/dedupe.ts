import { createHash } from 'node:crypto'
import { createSchema } from './factory.ts'
import type { Node, OperationNode, SchemaNode } from './nodes/index.ts'
import { extractRefName } from './refs.ts'
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
   * Returns `true` when a node is eligible to be deduplicated (for example enums and objects).
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
  /**
   * Returns `true` to exclude a node from deduplication (for example circular shapes).
   */
  skip?: (node: SchemaNode) => boolean
}

/**
 * The shape-affecting flags shared by every node kind: base primitive, format, and `nullable`.
 * Documentation and usage-slot flags (`optional`/`nullish`/`readOnly`/`writeOnly`) are
 * intentionally excluded — they describe the property slot, not the type.
 */
function flagsDescriptor(node: SchemaNode): string {
  return `${node.primitive ?? ''};${node.format ?? ''};${node.nullable ? 1 : 0}`
}

function refTargetName(node: Extract<SchemaNode, { type: 'ref' }>): string {
  if (node.ref) return extractRefName(node.ref)
  return node.name ?? ''
}

/**
 * Builds the local, shape-only descriptor for a node: its kind, flags, constraints, and its
 * children's signatures. {@link signatureOf} hashes this string; children contribute their
 * fixed-length signature rather than their own full descriptor, which keeps the result bounded.
 */
function describeShape(node: SchemaNode, signatures: Map<SchemaNode, string>): string {
  const flags = flagsDescriptor(node)

  switch (node.type) {
    case 'object': {
      const props = (node.properties ?? []).map((prop) => `${prop.name}${prop.required ? '!' : '?'}${signatureOf(prop.schema, signatures)}`).join(',')
      let additional = ''
      if (typeof node.additionalProperties === 'boolean') {
        additional = `ab:${node.additionalProperties}`
      } else if (node.additionalProperties) {
        additional = `as:${signatureOf(node.additionalProperties, signatures)}`
      }
      const pattern = node.patternProperties
        ? Object.keys(node.patternProperties)
            .sort()
            .map((key) => `${key}=${signatureOf(node.patternProperties![key]!, signatures)}`)
            .join(',')
        : ''
      return `object|${flags}|p[${props}]|${additional}|pp[${pattern}]|mn:${node.minProperties ?? ''}|mx:${node.maxProperties ?? ''}`
    }
    case 'array':
    case 'tuple': {
      const items = (node.items ?? []).map((item) => signatureOf(item, signatures)).join(',')
      const rest = node.rest ? signatureOf(node.rest, signatures) : ''
      return `${node.type}|${flags}|i[${items}]|r:${rest}|mn:${node.min ?? ''}|mx:${node.max ?? ''}|u:${node.unique ? 1 : 0}`
    }
    case 'union': {
      const members = (node.members ?? []).map((member) => signatureOf(member, signatures)).join(',')
      return `union|${flags}|s:${node.strategy ?? ''}|d:${node.discriminatorPropertyName ?? ''}|m[${members}]`
    }
    case 'intersection': {
      const members = (node.members ?? []).map((member) => signatureOf(member, signatures)).join(',')
      return `intersection|${flags}|m[${members}]`
    }
    case 'enum': {
      let values = ''
      if (node.namedEnumValues?.length) {
        values = node.namedEnumValues.map((entry) => `${entry.name}=${entry.primitive}:${String(entry.value)}`).join(',')
      } else if (node.enumValues?.length) {
        values = node.enumValues.map((value) => `${value === null ? 'null' : typeof value}:${String(value)}`).join(',')
      }
      return `enum|${flags}|v[${values}]`
    }
    case 'ref':
      return `ref|${flags}|->${refTargetName(node)}`
    case 'string':
      return `string|${flags}|mn:${node.min ?? ''}|mx:${node.max ?? ''}|pt:${node.pattern ?? ''}`
    case 'number':
    case 'integer':
    case 'bigint':
      return `${node.type}|${flags}|mn:${node.min ?? ''}|mx:${node.max ?? ''}|emn:${node.exclusiveMinimum ?? ''}|emx:${node.exclusiveMaximum ?? ''}|mo:${node.multipleOf ?? ''}`
    case 'url':
      return `url|${flags}|path:${node.path ?? ''}|mn:${node.min ?? ''}|mx:${node.max ?? ''}`
    case 'uuid':
    case 'email':
      return `${node.type}|${flags}|mn:${node.min ?? ''}|mx:${node.max ?? ''}`
    case 'datetime':
      return `datetime|${flags}|o:${node.offset ? 1 : 0}|l:${node.local ? 1 : 0}`
    case 'date':
    case 'time':
      return `${node.type}|${flags}|rep:${node.representation}`
    default:
      return `${node.type}|${flags}`
  }
}

/**
 * Hash-consing: each node's signature is a fixed-length digest of its local shape plus its
 * children's digests (a Merkle hash). Children contribute their 64-char hash instead of their
 * full nested descriptor, so a signature stays bounded regardless of subtree depth, and the
 * digest is identical across calls because it depends only on content — never on traversal
 * order. This keeps the keys built during planning consistent with the ones recomputed later
 * during streaming. `signatures` memoizes node → digest within a single computation.
 */
function signatureOf(node: SchemaNode, signatures: Map<SchemaNode, string>): string {
  const cached = signatures.get(node)
  if (cached !== undefined) return cached
  const signature = createHash('sha256').update(describeShape(node, signatures)).digest('hex')
  signatures.set(node, signature)
  return signature
}

/**
 * Computes a deterministic, shape-only signature (a fixed-length content hash) for a schema node.
 *
 * Two schemas share a signature when they are structurally identical, ignoring
 * documentation (`name`, `title`, `description`, `example`, `default`, `deprecated`)
 * and usage-slot flags (`optional`, `nullish`, `readOnly`, `writeOnly`). `nullable`
 * is kept because it changes the produced type. `ref` nodes compare by target name,
 * which also keeps the algorithm terminating on circular shapes.
 *
 * @example Two enums with different descriptions share a signature
 * ```ts
 * schemaSignature(createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'], description: 'x' })) ===
 *   schemaSignature(createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] }))
 * ```
 */
export function schemaSignature(node: SchemaNode): string {
  return signatureOf(node, new Map())
}

/**
 * Returns `true` when two schema nodes are structurally identical under shape-only equality.
 *
 * @example
 * ```ts
 * isSchemaEqual(a, b) // a and b produce the same TypeScript type
 * ```
 */
export function isSchemaEqual(a: SchemaNode, b: SchemaNode): boolean {
  return schemaSignature(a) === schemaSignature(b)
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
  const { isCandidate, nameFor, refFor, minOccurrences = 2, skip } = options

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
    if (!isCandidate(schemaNode) || skip?.(schemaNode)) return

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
