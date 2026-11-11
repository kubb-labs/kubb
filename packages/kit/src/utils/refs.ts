import { pascalCase } from '@internals/utils'

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
