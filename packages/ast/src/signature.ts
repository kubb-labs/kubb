import { hash } from 'node:crypto'
import type { SchemaNode } from './nodes/index.ts'
import { extractRefName } from './refs.ts'

/**
 * The shape-affecting flags shared by every node kind: base primitive, format, and `nullable`.
 * Documentation and usage-slot flags (`optional`/`nullish`/`readOnly`/`writeOnly`) are
 * intentionally excluded, they describe the property slot, not the type.
 */
function flagsDescriptor(node: SchemaNode): string {
  return `${node.primitive ?? ''};${node.format ?? ''};${node.nullable ? 1 : 0}`
}

function refTargetName(node: Extract<SchemaNode, { type: 'ref' }>): string {
  if (node.ref) return extractRefName(node.ref)
  return node.name ?? ''
}

type ScalarField = { kind: 'scalar'; key: string; prefix: string }
type BoolField = { kind: 'bool'; key: string; prefix: string }
type ChildField = { kind: 'child'; key: string; prefix: string }
type ChildrenField = { kind: 'children'; key: string; prefix: string }
type ObjectPropsField = { kind: 'objectProps' }
type AdditionalPropsField = { kind: 'additionalProps' }
type PatternPropsField = { kind: 'patternProps' }
type EnumValuesField = { kind: 'enumValues' }
type RefTargetField = { kind: 'refTarget' }

type ShapeField =
  | ScalarField
  | BoolField
  | ChildField
  | ChildrenField
  | ObjectPropsField
  | AdditionalPropsField
  | PatternPropsField
  | EnumValuesField
  | RefTargetField

const arrayTupleFields: ReadonlyArray<ShapeField> = [
  { kind: 'children', key: 'items', prefix: 'i' },
  { kind: 'child', key: 'rest', prefix: 'r' },
  { kind: 'scalar', key: 'min', prefix: 'mn' },
  { kind: 'scalar', key: 'max', prefix: 'mx' },
  { kind: 'bool', key: 'unique', prefix: 'u' },
]

const numericFields: ReadonlyArray<ShapeField> = [
  { kind: 'scalar', key: 'min', prefix: 'mn' },
  { kind: 'scalar', key: 'max', prefix: 'mx' },
  { kind: 'scalar', key: 'exclusiveMinimum', prefix: 'emn' },
  { kind: 'scalar', key: 'exclusiveMaximum', prefix: 'emx' },
  { kind: 'scalar', key: 'multipleOf', prefix: 'mo' },
]

const rangeFields: ReadonlyArray<ShapeField> = [
  { kind: 'scalar', key: 'min', prefix: 'mn' },
  { kind: 'scalar', key: 'max', prefix: 'mx' },
]

/**
 * Maps each schema node `type` to the ordered list of shape-contributing fields.
 * Node types absent from this map (scalar types like boolean, null, any, etc.) fall
 * back to `${type}|${flags}` with no additional fields.
 */
const SHAPE_KEYS: Partial<Record<SchemaNode['type'], ReadonlyArray<ShapeField>>> = {
  object: [
    { kind: 'objectProps' },
    { kind: 'additionalProps' },
    { kind: 'patternProps' },
    { kind: 'scalar', key: 'minProperties', prefix: 'mn' },
    { kind: 'scalar', key: 'maxProperties', prefix: 'mx' },
  ],
  array: arrayTupleFields,
  tuple: arrayTupleFields,
  union: [
    { kind: 'scalar', key: 'strategy', prefix: 's' },
    { kind: 'scalar', key: 'discriminatorPropertyName', prefix: 'd' },
    { kind: 'children', key: 'members', prefix: 'm' },
  ],
  intersection: [{ kind: 'children', key: 'members', prefix: 'm' }],
  enum: [{ kind: 'enumValues' }],
  ref: [{ kind: 'refTarget' }],
  string: [
    { kind: 'scalar', key: 'min', prefix: 'mn' },
    { kind: 'scalar', key: 'max', prefix: 'mx' },
    { kind: 'scalar', key: 'pattern', prefix: 'pt' },
  ],
  number: numericFields,
  integer: numericFields,
  bigint: numericFields,
  url: [
    { kind: 'scalar', key: 'path', prefix: 'path' },
    { kind: 'scalar', key: 'min', prefix: 'mn' },
    { kind: 'scalar', key: 'max', prefix: 'mx' },
  ],
  uuid: rangeFields,
  email: rangeFields,
  datetime: [
    { kind: 'bool', key: 'offset', prefix: 'o' },
    { kind: 'bool', key: 'local', prefix: 'l' },
  ],
  date: [{ kind: 'scalar', key: 'representation', prefix: 'rep' }],
  time: [{ kind: 'scalar', key: 'representation', prefix: 'rep' }],
}

function serializeShapeField(field: ShapeField, node: SchemaNode, record: Record<string, unknown>): string {
  switch (field.kind) {
    case 'scalar':
      return `${field.prefix}:${record[field.key] ?? ''}`
    case 'bool':
      return `${field.prefix}:${record[field.key] ? 1 : 0}`
    case 'child': {
      const child = record[field.key] as SchemaNode | undefined
      return `${field.prefix}:${child ? signatureOf(child) : ''}`
    }
    case 'children': {
      const children = (record[field.key] as Array<SchemaNode> | undefined) ?? []
      return `${field.prefix}[${children.map((c) => signatureOf(c)).join(',')}]`
    }
    case 'objectProps': {
      const obj = node as Extract<SchemaNode, { type: 'object' }>
      const props = (obj.properties ?? []).map((prop) => `${prop.name}${prop.required ? '!' : '?'}${signatureOf(prop.schema)}`).join(',')
      return `p[${props}]`
    }
    case 'additionalProps': {
      const obj = node as Extract<SchemaNode, { type: 'object' }>
      if (typeof obj.additionalProperties === 'boolean') return `ab:${obj.additionalProperties}`
      if (obj.additionalProperties) return `as:${signatureOf(obj.additionalProperties)}`
      return ''
    }
    case 'patternProps': {
      const obj = node as Extract<SchemaNode, { type: 'object' }>
      const pattern = obj.patternProperties
        ? Object.keys(obj.patternProperties)
            .sort()
            .map((key) => `${key}=${signatureOf(obj.patternProperties![key]!)}`)
            .join(',')
        : ''
      return `pp[${pattern}]`
    }
    case 'enumValues': {
      const en = node as Extract<SchemaNode, { type: 'enum' }>
      let values = ''
      if (en.namedEnumValues?.length) {
        values = en.namedEnumValues.map((entry) => `${entry.name}=${entry.primitive}:${String(entry.value)}`).join(',')
      } else if (en.enumValues?.length) {
        values = en.enumValues.map((value) => `${value === null ? 'null' : typeof value}:${String(value)}`).join(',')
      }
      return `v[${values}]`
    }
    case 'refTarget': {
      return `->${refTargetName(node as Extract<SchemaNode, { type: 'ref' }>)}`
    }
  }
}

/**
 * Builds the local, shape-only descriptor for a node: its kind, flags, constraints, and its
 * children's signatures. {@link signatureOf} hashes this string. Children contribute their
 * fixed-length signature rather than their own full descriptor, which keeps the result bounded.
 */
function describeShape(node: SchemaNode): string {
  const flags = flagsDescriptor(node)
  const fields = SHAPE_KEYS[node.type]
  if (!fields) return `${node.type}|${flags}`

  const record = node as unknown as Record<string, unknown>
  const parts: Array<string> = [`${node.type}|${flags}`]
  for (const field of fields) {
    parts.push(serializeShapeField(field, node, record))
  }
  return parts.join('|')
}

/**
 * Persistent hash-consing cache: `SchemaNode` → signature digest, keyed by node identity.
 *
 * A `WeakMap` so entries are released once the node is garbage-collected, and so a node hashed
 * during dedupe planning is not re-hashed when the same tree is rewritten during streaming
 * (where `schemaSignature` and `applyDedupe` would otherwise each walk it from scratch). Reuse
 * across calls is sound because a signature depends only on a node's content, and schema nodes
 * are immutable once created, transforms allocate new objects rather than mutating in place.
 */
const signatureCache = new WeakMap<SchemaNode, string>()

/**
 * Hash-consing: each node's signature is a fixed-length digest of its local shape plus its
 * children's digests (a Merkle hash). Children contribute their 64-char hash instead of their
 * full nested descriptor, so a signature stays bounded regardless of subtree depth, and the
 * digest is identical across calls because it depends only on content, never on traversal
 * order. This keeps the keys built during planning consistent with the ones recomputed later
 * during streaming. {@link signatureCache} memoizes node → digest across every computation.
 */
export function signatureOf(node: SchemaNode): string {
  const cached = signatureCache.get(node)
  if (cached !== undefined) return cached
  const signature = hash('sha256', describeShape(node), 'hex')
  signatureCache.set(node, signature)
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
  return signatureOf(node)
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
