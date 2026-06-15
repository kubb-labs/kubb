import { pascalCase } from '@internals/utils'
import { narrowSchema } from '../guards.ts'
import type { OperationNode, ParameterNode, SchemaNode } from '../nodes/index.ts'
import type { SchemaType } from '../nodes/schema.ts'
import type { OperationParamsResolver, ParamGroupType } from './operationParams.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Returns the last path segment of a reference string.
 *
 * @example
 * ```ts
 * extractRefName('#/components/schemas/Pet') // 'Pet'
 * ```
 */
export function extractRefName(ref: string): string {
  return ref.split('/').at(-1) ?? ref
}

/**
 * Resolves the schema name of a ref node, falling back through `ref` → `name` → nested `schema.name`.
 *
 * Returns `null` for non-ref nodes or when no name resolves.
 *
 * @example
 * ```ts
 * resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Pet' })
 * // => 'Pet'
 * ```
 */
export function resolveRefName(node: SchemaNode | undefined): string | null {
  if (!node || node.type !== 'ref') return null
  if (node.ref) return extractRefName(node.ref) ?? node.name ?? node.schema?.name ?? null

  return node.name ?? node.schema?.name ?? null
}

/**
 * Builds a PascalCase child schema name by joining a parent name and property name.
 * Returns `null` when there is no parent to nest under.
 *
 * @example
 * ```ts
 * childName('Order', 'shipping_address') // 'OrderShippingAddress'
 * childName(undefined, 'params')         // null
 * ```
 */
export function childName(parentName: string | null | undefined, propName: string): string | null {
  return parentName ? pascalCase([parentName, propName].join(' ')) : null
}

/**
 * Builds a PascalCase enum name from the parent name, property name, and a suffix, skipping any
 * empty parts.
 *
 * @example
 * ```ts
 * enumPropName('Order', 'status', 'enum') // 'OrderStatusEnum'
 * ```
 */
export function enumPropName(parentName: string | null | undefined, propName: string, enumSuffix: string): string {
  return pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
}

/**
 * Type guard that returns `true` when a schema emits as a plain `string` type.
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

/**
 * Derives a {@link ParamGroupType} for a query or header group from the resolver.
 *
 * Returns `null` when there is no resolver, no params, or the group name equals the
 * individual param name (so there is no real group to emit).
 */
export function resolveGroupType({
  node,
  params,
  group,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  group: 'query' | 'header'
  resolver: OperationParamsResolver | undefined
}): ParamGroupType | null {
  if (!resolver || !params.length) {
    return null
  }
  const firstParam = params[0]!
  const groupMethod = group === 'query' ? resolver.resolveQueryParamsName : resolver.resolveHeaderParamsName
  const groupName = groupMethod.call(resolver, node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) {
    return null
  }
  return { type: groupName, optional: params.every((p) => !p.required) }
}
