import { describe, expect, it } from 'vitest'
import { childName, enumPropName, extractRefName, findDiscriminator } from './index.ts'

describe('extractRefName', () => {
  it('extracts schema name from component schema refs', () => {
    expect(extractRefName('#/components/schemas/Order')).toBe('Order')
  })

  it('extracts name from component response refs', () => {
    expect(extractRefName('#/components/responses/NotFound')).toBe('NotFound')
  })

  it('falls back to the full string when no slash is present', () => {
    expect(extractRefName('SomeName')).toBe('SomeName')
  })
})

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
  })

  it('works without parentName and with a custom suffix', () => {
    expect(enumPropName(undefined, 'status', 'enum')).toBe('StatusEnum')
    expect(enumPropName('Order', 'status', 'Type')).toBe('OrderStatusType')
  })
})

describe('findDiscriminator', () => {
  it('returns the mapping key for a matching discriminator ref', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
      dog: '#/components/schemas/Dog',
    }

    expect(findDiscriminator(mapping, '#/components/schemas/Dog')).toBe('dog')
  })

  it.each([
    {
      label: 'mapping is missing',
      mapping: undefined,
      ref: '#/components/schemas/Dog' as string | undefined,
    },
    {
      label: 'ref is missing',
      mapping: { cat: '#/components/schemas/Cat' },
      ref: undefined,
    },
    {
      label: 'ref does not match any mapping entry',
      mapping: { cat: '#/components/schemas/Cat' },
      ref: '#/components/schemas/Dog',
    },
  ])('returns null when $label', ({ mapping, ref }) => {
    expect(findDiscriminator(mapping, ref)).toBeNull()
  })
})
