import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { childName, enumPropName, extractRefName, isStringType, syncSchemaRef } from './refs.ts'

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

describe('isStringType', () => {
  it('returns true for plain string-like schema types', () => {
    expect(isStringType(ast.factory.createSchema({ type: 'string' }))).toBe(true)
    expect(isStringType(ast.factory.createSchema({ type: 'uuid' }))).toBe(true)
    expect(isStringType(ast.factory.createSchema({ type: 'email' }))).toBe(true)
    expect(isStringType(ast.factory.createSchema({ type: 'url' }))).toBe(true)
    expect(isStringType(ast.factory.createSchema({ type: 'datetime' }))).toBe(true)
  })

  it('returns true for date/time with string representation', () => {
    expect(isStringType(ast.factory.createSchema({ type: 'date', representation: 'string' }))).toBe(true)
    expect(isStringType(ast.factory.createSchema({ type: 'time', representation: 'string' }))).toBe(true)
  })

  it('returns false for date/time with date representation and non-string scalars', () => {
    expect(isStringType(ast.factory.createSchema({ type: 'date', representation: 'date' }))).toBe(false)
    expect(isStringType(ast.factory.createSchema({ type: 'time', representation: 'date' }))).toBe(false)
    expect(isStringType(ast.factory.createSchema({ type: 'number' }))).toBe(false)
  })
})

describe('syncSchemaRef', () => {
  it('merges sibling overrides over the resolved schema', () => {
    const resolved = ast.factory.createSchema({ type: 'object', description: 'Original' })
    const ref = ast.factory.createSchema({
      type: 'ref',
      name: 'Pet',
      ref: '#/components/schemas/Pet',
      schema: resolved,
      description: 'Override',
      readOnly: true,
    })

    const merged = syncSchemaRef(ref)
    expect(merged.description).toBe('Override')
    expect(merged.readOnly).toBe(true)
    expect(merged.type).toBe('object')
  })

  it('returns a non-ref node unchanged', () => {
    const node = ast.factory.createSchema({ type: 'string' })
    expect(syncSchemaRef(node)).toBe(node)
  })
})
