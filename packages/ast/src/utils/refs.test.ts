import { describe, expect, it } from 'vitest'
import { createSchema } from '../nodes/schema.ts'
import { childName, enumPropName, extractRefName, isStringType, resolveRefName, syncSchemaRef } from './refs.ts'

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

describe('resolveRefName', () => {
  it('extracts the name from a $ref pointer', () => {
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })

    expect(resolveRefName(ref)).toBe('Pet')
  })

  it('prefers targetName over the pointer segment', () => {
    const ref = createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' })

    expect(resolveRefName(ref)).toBe('OrderSchema')
  })

  it('falls back to node.name when ref is missing', () => {
    const ref = createSchema({ type: 'ref', name: 'Pet' })

    expect(resolveRefName(ref)).toBe('Pet')
  })

  it('returns null for non-ref nodes', () => {
    expect(resolveRefName(createSchema({ type: 'string' }))).toBeNull()
    expect(resolveRefName(undefined)).toBeNull()
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

describe('isStringType', () => {
  it('returns true for plain string-like schema types', () => {
    expect(isStringType(createSchema({ type: 'string' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'uuid' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'email' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'url' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'datetime' }))).toBe(true)
  })

  it('returns true for date/time with string representation', () => {
    expect(isStringType(createSchema({ type: 'date', representation: 'string' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'time', representation: 'string' }))).toBe(true)
  })

  it('returns false for date/time with date representation and non-string scalars', () => {
    expect(isStringType(createSchema({ type: 'date', representation: 'date' }))).toBe(false)
    expect(isStringType(createSchema({ type: 'time', representation: 'date' }))).toBe(false)
    expect(isStringType(createSchema({ type: 'number' }))).toBe(false)
  })
})

describe('syncSchemaRef', () => {
  it('merges sibling overrides over the resolved schema', () => {
    const resolved = createSchema({ type: 'object', description: 'Original' })
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema: resolved, description: 'Override', readOnly: true })

    const merged = syncSchemaRef(ref)
    expect(merged.description).toBe('Override')
    expect(merged.readOnly).toBe(true)
    expect(merged.type).toBe('object')
  })

  it('returns a non-ref node unchanged', () => {
    const node = createSchema({ type: 'string' })
    expect(syncSchemaRef(node)).toBe(node)
  })
})
