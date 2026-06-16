import { describe, expect, it } from 'vitest'
import { createFunctionParameter, createFunctionParameters, createIndexedAccessType, createObjectBindingPattern, createTypeLiteral } from './function.ts'

describe('createTypeLiteral', () => {
  it('creates an inline object type from members', () => {
    const node = createTypeLiteral({
      members: [
        { name: 'petId', type: 'string', optional: false },
        { name: 'name', type: 'string', optional: true },
      ],
    })

    expect(node).toStrictEqual({
      kind: 'TypeLiteral',
      members: [
        { name: 'petId', type: 'string', optional: false },
        { name: 'name', type: 'string', optional: true },
      ],
    })
  })
})

describe('createIndexedAccessType', () => {
  it('creates an indexed access type', () => {
    const node = createIndexedAccessType({ target: 'GetPetPathParams', key: 'petId' })

    expect(node).toStrictEqual({
      kind: 'IndexedAccessType',
      target: 'GetPetPathParams',
      key: 'petId',
    })
  })
})

describe('createObjectBindingPattern', () => {
  it('creates a destructuring binding from elements', () => {
    const node = createObjectBindingPattern({ elements: [{ name: 'id' }, { name: 'name' }] })

    expect(node).toStrictEqual({
      kind: 'ObjectBindingPattern',
      elements: [{ name: 'id' }, { name: 'name' }],
    })
  })
})

describe('createFunctionParameter', () => {
  it('defaults optional to false and accepts a plain string type', () => {
    const node = createFunctionParameter({ name: 'petId', type: 'string' })

    expect(node.kind).toBe('FunctionParameter')
    expect(node.name).toBe('petId')
    expect(node.type).toBe('string')
    expect(node.optional).toBe(false)
  })

  it('supports optional true without default', () => {
    const node = createFunctionParameter({ name: 'query', type: 'Query', optional: true })

    expect(node.optional).toBe(true)
    expect(node.default).toBeUndefined()
  })

  it('supports default value with optional false/omitted', () => {
    const node = createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' })

    expect(node.optional).toBe(false)
    expect(node.default).toBe('{}')
  })

  it('builds a destructured group from properties', () => {
    const node = createFunctionParameter({
      properties: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string', optional: true },
      ],
      default: '{}',
    })

    expect(node).toStrictEqual({
      kind: 'FunctionParameter',
      name: {
        kind: 'ObjectBindingPattern',
        elements: [{ name: 'id' }, { name: 'name' }],
      },
      type: {
        kind: 'TypeLiteral',
        members: [
          { name: 'id', type: 'string', optional: false },
          { name: 'name', type: 'string', optional: true },
        ],
      },
      optional: false,
      default: '{}',
    })
  })
})

describe('createFunctionParameters', () => {
  it('defaults params to empty array', () => {
    const node = createFunctionParameters()

    expect(node.kind).toBe('FunctionParameters')
    expect(node.params).toStrictEqual([])
  })

  it('accepts params override', () => {
    const params = [createFunctionParameter({ name: 'petId', type: 'string' })]
    const node = createFunctionParameters({ params })

    expect(node.params).toStrictEqual(params)
  })
})
