import { hash } from 'node:crypto'
import type { SchemaNode } from './nodes/index.ts'
import { extractRefName } from './utils/index.ts'

/**
 * The flags shared by every node kind that affect its type: `primitive`, `format`, `nullable`.
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
 * Maps each node `type` to its ordered shape-contributing fields. Types absent from the map
 * (boolean, null, any, and other scalars) fall back to `${type}|${flags}`.
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
 * Builds the local shape descriptor that {@link signatureOf} hashes: the node's kind, flags,
 * constraints, and its children's signatures.
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
 * Caches the digest per node, keyed by identity. A `WeakMap` so entries die with the node, and so
 * a tree hashed during dedupe planning is not walked again when it is rewritten during streaming.
 * Reuse is safe because a signature depends only on content, and nodes are immutable once created.
 */
const signatureCache = new WeakMap<SchemaNode, string>()

/**
 * Computes a deterministic, shape-only signature (a content hash) for a schema node. Two schemas
 * share a signature when they are structurally identical, ignoring documentation (`name`, `title`,
 * `description`, `examples`, `default`, `deprecated`) and usage-slot flags (`optional`, `nullish`,
 * `readOnly`, `writeOnly`). `nullable` is kept because it changes the produced type, and `ref`
 * nodes compare by target name, which also terminates on circular shapes.
 *
 * @example Two enums with different descriptions share a signature
 * ```ts
 * signatureOf(createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'], description: 'x' })) ===
 *   signatureOf(createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] }))
 * ```
 */
export function signatureOf(node: SchemaNode): string {
  const cached = signatureCache.get(node)
  if (cached !== undefined) return cached
  const signature = hash('sha256', describeShape(node), 'hex')
  signatureCache.set(node, signature)

  return signature
}

/**
 * Returns `true` when two schema nodes are structurally identical under shape-only equality,
 * meaning they produce the same TypeScript type.
 */
export function isSchemaEqual(a: SchemaNode, b: SchemaNode): boolean {
  return signatureOf(a) === signatureOf(b)
}
