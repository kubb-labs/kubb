import { ast } from '@kubb/ast'
import type { SchemaNode, SchemaType } from '@kubb/ast'
import { pascalCase } from '@internals/utils'

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
 * Applies `ast.mergeRefWithSchema()` to a resolved ref and rebuilds the result through
 * `ast.factory.createSchema()`. Non-ref nodes and unresolved refs are returned unchanged.
 *
 * @example
 * ```ts
 * const ref = ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Pet', description: 'A cute pet' })
 * const merged = syncSchemaRef(ref) // merges with resolved Pet schema
 * ```
 */
export function syncSchemaRef(node: SchemaNode): SchemaNode {
  const ref = ast.narrowSchema(node, 'ref')

  if (!ref?.schema) return node

  return ast.factory.createSchema(ast.mergeRefWithSchema(ref))
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

  const temporal = ast.narrowSchema(node, 'date') ?? ast.narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}
