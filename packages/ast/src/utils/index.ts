import { pascalCase } from '@internals/utils'
import type { OperationNode, ParameterNode } from '../nodes/index.ts'
import type { OperationParamsResolver, ParamGroupType } from './ast.ts'

export { isValidVarName } from '@internals/utils'
export { buildJSDoc, buildList, buildObject, objectKey } from './codegen.ts'
export { extractStringsFromNodes } from './extractStringsFromNodes.ts'
export { getNestedAccessor, jsStringEscape, stringify, stringifyObject, toRegExpString, trimQuotes } from './strings.ts'
export {
  buildGroupParam,
  buildTypeLiteral,
  caseParams,
  collectUsedSchemaNames,
  containsCircularRef,
  findCircularSchemas,
  isStringType,
  resolveParamType,
  syncSchemaRef,
} from './ast.ts'
export type { BuildGroupArgs, ParamGroupType } from './ast.ts'

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
 * Returns the discriminator key whose mapping value matches `ref`, or `null` when there is no match.
 *
 * @example
 * ```ts
 * findDiscriminator({ dog: '#/components/schemas/Dog' }, '#/components/schemas/Dog') // 'dog'
 * ```
 */
export function findDiscriminator(mapping: Record<string, string> | undefined, ref: string | undefined): string | null {
  if (!mapping || !ref) return null
  return Object.entries(mapping).find(([, value]) => value === ref)?.[0] ?? null
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
