import { describe, expect, expectTypeOf, it } from 'vitest'
import { createArrowFunction, createConst, createFunction, createType } from './code.ts'
import type { ArrowFunctionNode, ConstNode, FunctionNode, TypeNode } from './code.ts'

describe('createConst', () => {
  it('creates a ConstNode with required name', () => {
    const node = createConst({ name: 'pet' })

    expect(node.kind).toBe('Const')
    expect(node.name).toBe('pet')
    expect(node.export).toBeUndefined()
    expect(node.asConst).toBeUndefined()
    expect(node.type).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export, type and asConst flags', () => {
    const node = createConst({
      name: 'pets',
      export: true,
      type: 'Pet[]',
      asConst: true,
    })

    expect(node.export).toBe(true)
    expect(node.type).toBe('Pet[]')
    expect(node.asConst).toBe(true)
  })

  it('accepts JSDoc comments', () => {
    const node = createConst({
      name: 'pet',
      JSDoc: { comments: ['@description A pet resource'] },
    })

    expect(node.JSDoc?.comments).toStrictEqual(['@description A pet resource'])
  })

  it('accepts child nodes', () => {
    const child = createType({ name: 'Pet' })
    const node = createConst({ name: 'pet', nodes: [child] })

    expect(node.nodes).toHaveLength(1)
    const first = node.nodes?.[0]
    expect(typeof first === 'object' && first.kind).toBe('Type')
  })

  it('always sets kind to Const', () => {
    // @ts-expect-error — kind should be forced to 'Const'
    const node = createConst({ name: 'x', kind: 'Import' })

    expect(node.kind).toBe('Const')
  })

  it('narrows the return type to ConstNode', () => {
    expectTypeOf(createConst({ name: 'pet' })).toMatchTypeOf<ConstNode>()
  })
})

describe('createType', () => {
  it('creates a TypeNode with required name', () => {
    const node = createType({ name: 'Pet' })

    expect(node.kind).toBe('Type')
    expect(node.name).toBe('Pet')
    expect(node.export).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export flag and JSDoc', () => {
    const node = createType({
      name: 'PetStatus',
      export: true,
      JSDoc: { comments: ['@description Status of a pet'] },
    })

    expect(node.export).toBe(true)
    expect(node.JSDoc?.comments).toStrictEqual(['@description Status of a pet'])
  })

  it('accepts child nodes', () => {
    const child = createConst({ name: 'value' })
    const node = createType({ name: 'PetStatus', nodes: [child] })

    expect(node.nodes).toHaveLength(1)
    const first = node.nodes?.[0]
    expect(typeof first === 'object' && first.kind).toBe('Const')
  })

  it('always sets kind to Type', () => {
    // @ts-expect-error — kind should be forced to 'Type'
    const node = createType({ name: 'X', kind: 'Import' })

    expect(node.kind).toBe('Type')
  })

  it('narrows the return type to TypeNode', () => {
    expectTypeOf(createType({ name: 'Pet' })).toMatchTypeOf<TypeNode>()
  })
})

describe('createFunction', () => {
  it('creates a FunctionNode with required name', () => {
    const node = createFunction({ name: 'getPet' })

    expect(node.kind).toBe('Function')
    expect(node.name).toBe('getPet')
    expect(node.export).toBeUndefined()
    expect(node.async).toBeUndefined()
    expect(node.params).toBeUndefined()
    expect(node.returnType).toBeUndefined()
    expect(node.generics).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export, async, params, returnType and generics', () => {
    const node = createFunction({
      name: 'fetchPet',
      export: true,
      async: true,
      params: 'id: string',
      returnType: 'Pet',
      generics: ['T'],
    })

    expect(node.export).toBe(true)
    expect(node.async).toBe(true)
    expect(node.params).toBe('id: string')
    expect(node.returnType).toBe('Pet')
    expect(node.generics).toStrictEqual(['T'])
  })

  it('accepts default export flag', () => {
    const node = createFunction({
      name: 'handler',
      default: true,
      export: true,
    })

    expect(node.default).toBe(true)
  })

  it('accepts JSDoc and child nodes', () => {
    const node = createFunction({
      name: 'getPet',
      JSDoc: { comments: ['@description Fetch a pet'] },
      nodes: [createConst({ name: 'url' })],
    })

    expect(node.JSDoc?.comments).toStrictEqual(['@description Fetch a pet'])
    expect(node.nodes).toHaveLength(1)
  })

  it('always sets kind to Function', () => {
    // @ts-expect-error — kind should be forced to 'Function'
    const node = createFunction({ name: 'x', kind: 'Import' })

    expect(node.kind).toBe('Function')
  })

  it('narrows the return type to FunctionNode', () => {
    expectTypeOf(createFunction({ name: 'getPet' })).toMatchTypeOf<FunctionNode>()
  })
})

describe('createArrowFunction', () => {
  it('creates an ArrowFunctionNode with required name', () => {
    const node = createArrowFunction({ name: 'getPet' })

    expect(node.kind).toBe('ArrowFunction')
    expect(node.name).toBe('getPet')
    expect(node.export).toBeUndefined()
    expect(node.async).toBeUndefined()
    expect(node.singleLine).toBeUndefined()
    expect(node.params).toBeUndefined()
    expect(node.returnType).toBeUndefined()
    expect(node.generics).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export, async, params, returnType, generics and singleLine', () => {
    const node = createArrowFunction({
      name: 'double',
      export: true,
      async: false,
      params: 'n: number',
      returnType: 'number',
      generics: 'T',
      singleLine: true,
    })

    expect(node.export).toBe(true)
    expect(node.async).toBe(false)
    expect(node.params).toBe('n: number')
    expect(node.returnType).toBe('number')
    expect(node.generics).toBe('T')
    expect(node.singleLine).toBe(true)
  })

  it('accepts JSDoc and child nodes', () => {
    const node = createArrowFunction({
      name: 'fetchPet',
      JSDoc: { comments: ['@description Fetch a pet'] },
      nodes: [createConst({ name: 'url' })],
    })

    expect(node.JSDoc?.comments).toStrictEqual(['@description Fetch a pet'])
    expect(node.nodes).toHaveLength(1)
  })

  it('accepts default export flag', () => {
    const node = createArrowFunction({
      name: 'handler',
      default: true,
      export: true,
    })

    expect(node.default).toBe(true)
  })

  it('always sets kind to ArrowFunction', () => {
    // @ts-expect-error — kind should be forced to 'ArrowFunction'
    const node = createArrowFunction({ name: 'x', kind: 'Import' })

    expect(node.kind).toBe('ArrowFunction')
  })

  it('narrows the return type to ArrowFunctionNode', () => {
    expectTypeOf(createArrowFunction({ name: 'getPet' })).toMatchTypeOf<ArrowFunctionNode>()
  })
})
