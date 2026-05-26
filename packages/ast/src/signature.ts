import { createHash } from 'node:crypto'
import type { SchemaNode } from './nodes/index.ts'
import { extractRefName } from './refs.ts'

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
export function signatureOf(node: SchemaNode, signatures: Map<SchemaNode, string>): string {
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
