import { pascalCase } from '@internals/utils'
import { narrowSchema } from '../guards.ts'
import type { SchemaNode } from '../nodes/index.ts'
import { createSchema, type SchemaType } from '../nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Returns the last path segment of a reference string.
 *
 * @example
 * `extractRefName('#/components/schemas/Pet') // 'Pet'`
 */
export function extractRefName(ref: string): string {
  return ref.split('/').at(-1) ?? ref
}

/**
 * Resolves the schema name of a ref node. Uses the last segment of `ref` when set, otherwise falls
 * back to `name` then nested `schema.name`.
 *
 * Returns `null` for non-ref nodes or when no name resolves.
 *
 * @example
 * `resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Pet' }) // 'Pet'`
 */
export function resolveRefName(node: SchemaNode | undefined): string | null {
  if (!node || node.type !== 'ref') return null
  if (node.ref) return extractRefName(node.ref)

  return node.name ?? node.schema?.name ?? null
}

/**
 * Builds a PascalCase child schema name by joining a parent name and property name.
 * Returns `null` when there is no parent to nest under.
 *
 * @example Nested under a parent
 * `childName('Order', 'shipping_address') // 'OrderShippingAddress'`
 *
 * @example No parent
 * `childName(undefined, 'params') // null`
 */
export function childName(parentName: string | null | undefined, propName: string): string | null {
  return parentName ? pascalCase([parentName, propName].join(' ')) : null
}

/**
 * Builds a PascalCase enum name from the parent name, property name, and a suffix, skipping any
 * empty parts.
 *
 * @example
 * `enumPropName('Order', 'status', 'enum') // 'OrderStatusEnum'`
 */
export function enumPropName(parentName: string | null | undefined, propName: string, enumSuffix: string): string {
  return pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
}

/**
 * Merges a ref node with its resolved schema, giving usage-site fields precedence.
 *
 * Every field set on the ref node except `kind`, `type`, `name`, `ref`, and `schema` overrides the
 * same field in the resolved `node.schema` (for example `description`, `nullable`, `readOnly`,
 * `deprecated`). Fields left `undefined` on the ref do not shadow the resolved schema. Non-ref
 * nodes and refs without a resolved `schema` are returned unchanged.
 *
 * @example
 * ```ts
 * const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Pet', description: 'A cute pet' })
 * const merged = syncSchemaRef(ref) // merges with resolved Pet schema
 * ```
 */
export function syncSchemaRef(node: SchemaNode): SchemaNode {
  const ref = narrowSchema(node, 'ref')

  if (!ref) return node
  if (!ref.schema) return node

  const { kind: _kind, type: _type, name: _name, ref: _ref, schema: _schema, ...overrides } = ref

  // Filter out undefined override values so they don't shadow the resolved schema's fields.
  const definedOverrides = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined))

  return createSchema({ ...ref.schema, ...definedOverrides })
}

/**
 * Returns `true` when a schema emits as a plain `string` type.
 *
 * Covers `string`, `uuid`, `email`, `url`, and `datetime` types. For `date` and `time`
 * types, returns `true` only when `representation` is `'string'` rather than `'date'`.
 */
export function isStringType(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) {
    return true
  }

  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}
