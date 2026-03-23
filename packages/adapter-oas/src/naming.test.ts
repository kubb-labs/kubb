import { createSchema } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { applyEnumName, resolveChildName, resolveEnumPropName } from './naming.ts'

describe('resolveChildName', () => {
  it('returns undefined when parentName is undefined', () => {
    expect(resolveChildName(undefined, 'params')).toBeUndefined()
  })

  it('returns PascalCase of parentName + propName', () => {
    expect(resolveChildName('Order', 'params')).toBe('OrderParams')
  })

  it('handles multi-word property names', () => {
    expect(resolveChildName('Order', 'shipping_address')).toBe('OrderShippingAddress')
  })
})

describe('resolveEnumPropName', () => {
  it('combines parentName, propName and enumSuffix', () => {
    expect(resolveEnumPropName('Order', 'status', 'enum')).toBe('OrderStatusEnum')
  })

  it('works without parentName', () => {
    expect(resolveEnumPropName(undefined, 'status', 'enum')).toBe('StatusEnum')
  })

  it('handles custom enumSuffix', () => {
    expect(resolveEnumPropName('Order', 'status', 'Type')).toBe('OrderStatusType')
  })
})

describe('applyEnumName', () => {
  it('assigns resolved name to enum node', () => {
    const node = createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] })
    const result = applyEnumName(node, 'Order', 'status', 'enum')

    expect(result.name).toBe('OrderStatusEnum')
  })

  it('strips name from boolean enum nodes', () => {
    const node = createSchema({ type: 'enum', primitive: 'boolean', enumValues: [true], name: 'ShouldDrop' })
    const result = applyEnumName(node, 'Order', 'enabled', 'enum')

    expect(result.name).toBeUndefined()
  })

  it('passes through non-enum nodes unchanged', () => {
    const node = createSchema({ type: 'string' })
    const result = applyEnumName(node, 'Order', 'status', 'enum')

    expect(result).toBe(node)
  })
})
