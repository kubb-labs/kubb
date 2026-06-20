import { describe, expect, expectTypeOf, it } from 'vitest'
import { createConst } from './code.ts'
import {
  createArray,
  createArrow,
  createAs,
  createCall,
  createIdentifier,
  createLiteral,
  createMember,
  createObject,
  createRaw,
  createSpread,
  isExpressionNode,
} from './expression.ts'
import type { ExpressionNode } from './expression.ts'

describe('createIdentifier', () => {
  it('creates an IdentifierNode', () => {
    expect(createIdentifier({ name: 'z' })).toStrictEqual({ kind: 'Identifier', name: 'z' })
  })
})

describe('createLiteral', () => {
  it('creates a LiteralNode for a string', () => {
    expect(createLiteral({ value: 'active' })).toStrictEqual({ kind: 'Literal', value: 'active' })
  })

  it('creates a LiteralNode for null', () => {
    expect(createLiteral({ value: null })).toStrictEqual({ kind: 'Literal', value: null })
  })
})

describe('createMember', () => {
  it('creates a MemberNode', () => {
    const node = createMember({ object: createIdentifier({ name: 'z' }), property: 'string' })

    expect(node).toStrictEqual({ kind: 'Member', object: { kind: 'Identifier', name: 'z' }, property: 'string' })
  })
})

describe('createCall', () => {
  it('builds a method chain from nested members and calls', () => {
    const node = createCall({ callee: createMember({ object: createIdentifier({ name: 'z' }), property: 'string' }), args: [] })

    expect(node).toStrictEqual({
      kind: 'Call',
      callee: { kind: 'Member', object: { kind: 'Identifier', name: 'z' }, property: 'string' },
      args: [],
    })
  })

  it('keeps typeArgs when provided', () => {
    const node = createCall({ callee: createIdentifier({ name: 'arrayElement' }), args: [], typeArgs: ['Pet'] })

    expect(node.typeArgs).toStrictEqual(['Pet'])
  })
})

describe('createObject', () => {
  it('creates an ObjectExpressionNode with prop, getter and spread members', () => {
    const node = createObject({
      properties: [
        { type: 'prop', key: 'id', value: createIdentifier({ name: 'x' }) },
        { type: 'getter', key: 'self', value: createIdentifier({ name: 'y' }), memoize: true },
        { type: 'spread', expression: createIdentifier({ name: 'base' }) },
      ],
    })

    expect(node).toStrictEqual({
      kind: 'ObjectExpression',
      properties: [
        { type: 'prop', key: 'id', value: { kind: 'Identifier', name: 'x' } },
        { type: 'getter', key: 'self', value: { kind: 'Identifier', name: 'y' }, memoize: true },
        { type: 'spread', expression: { kind: 'Identifier', name: 'base' } },
      ],
    })
  })
})

describe('createArray', () => {
  it('creates an ArrayExpressionNode', () => {
    const node = createArray({ elements: [createLiteral({ value: 1 }), createLiteral({ value: 2 })] })

    expect(node).toStrictEqual({
      kind: 'ArrayExpression',
      elements: [
        { kind: 'Literal', value: 1 },
        { kind: 'Literal', value: 2 },
      ],
    })
  })
})

describe('createArrow', () => {
  it('creates an ArrowExpressionNode', () => {
    const node = createArrow({ params: [], body: createIdentifier({ name: 'Pet' }), singleLine: true })

    expect(node).toStrictEqual({ kind: 'Arrow', params: [], body: { kind: 'Identifier', name: 'Pet' }, singleLine: true })
  })
})

describe('createSpread', () => {
  it('creates a SpreadNode', () => {
    expect(createSpread({ expression: createIdentifier({ name: 'rest' }) })).toStrictEqual({ kind: 'Spread', expression: { kind: 'Identifier', name: 'rest' } })
  })
})

describe('createAs', () => {
  it('creates an AsNode', () => {
    expect(createAs({ expression: createIdentifier({ name: 'undefined' }), type: 'any' })).toStrictEqual({
      kind: 'As',
      expression: { kind: 'Identifier', name: 'undefined' },
      type: 'any',
    })
  })
})

describe('createRaw', () => {
  it('creates a RawExpressionNode from a string', () => {
    expect(createRaw('z.string().optional()')).toStrictEqual({ kind: 'RawExpression', value: 'z.string().optional()' })
  })
})

describe('expression node typing', () => {
  it('forces kind to Identifier', () => {
    // @ts-expect-error — kind should be forced to 'Identifier'
    const node = createIdentifier({ name: 'z', kind: 'Literal' })

    expect(node.kind).toBe('Identifier')
  })

  it('narrows the return type to ExpressionNode', () => {
    expectTypeOf(createCall({ callee: createIdentifier({ name: 'z' }), args: [] })).toMatchTypeOf<ExpressionNode>()
  })
})

describe('isExpressionNode', () => {
  it('returns true for expression nodes', () => {
    expect(isExpressionNode(createIdentifier({ name: 'z' }))).toBe(true)
    expect(isExpressionNode(createObject({ properties: [] }))).toBe(true)
    expect(isExpressionNode(createRaw('x'))).toBe(true)
  })

  it('returns false for non-expression nodes and non-nodes', () => {
    expect(isExpressionNode(createConst({ name: 'x' }))).toBe(false)
    expect(isExpressionNode(null)).toBe(false)
    expect(isExpressionNode(undefined)).toBe(false)
    expect(isExpressionNode({})).toBe(false)
    expect(isExpressionNode('z.string()')).toBe(false)
  })
})
