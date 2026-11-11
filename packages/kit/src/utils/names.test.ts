import { describe, expect, it } from 'vitest'
import { childName, enumPropName } from './names.ts'

describe('childName', () => {
  it('returns null when parentName is undefined', () => {
    expect(childName(undefined, 'params')).toBeNull()
  })

  it('returns PascalCase of `parentName + propName`', () => {
    expect(childName('Order', 'params')).toBe('OrderParams')
    expect(childName('Order', 'shipping_address')).toBe('OrderShippingAddress')
  })
})

describe('enumPropName', () => {
  it('combines parentName, propName, and enumSuffix', () => {
    expect(enumPropName('Order', 'status', 'enum')).toBe('OrderStatusEnum')
    expect(enumPropName('Order', 'status', 'Type')).toBe('OrderStatusType')
  })
})
