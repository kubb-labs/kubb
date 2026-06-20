import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  createTypeArray,
  createTypeIntersection,
  createTypeKeyword,
  createTypeLiteralType,
  createTypeObject,
  createTypeOmit,
  createTypeReference,
  createTypeTuple,
  createTypeUnion,
  createTypeUrlTemplate,
  isTypeIRNode,
} from './type.ts'
import type { TypeIRNode } from './type.ts'

describe('createTypeKeyword', () => {
  it('creates a TypeKeywordNode', () => {
    expect(createTypeKeyword({ keyword: 'string' })).toStrictEqual({ kind: 'TypeKeyword', keyword: 'string' })
  })
})

describe('createTypeReference', () => {
  it('creates a reference with type args', () => {
    const node = createTypeReference({ name: 'Array', typeArgs: [createTypeKeyword({ keyword: 'string' })] })

    expect(node).toStrictEqual({ kind: 'TypeReference', name: 'Array', typeArgs: [{ kind: 'TypeKeyword', keyword: 'string' }] })
  })
})

describe('createTypeLiteralType', () => {
  it('creates a literal type', () => {
    expect(createTypeLiteralType({ value: 'active', format: 'string' })).toStrictEqual({ kind: 'TypeLiteralType', value: 'active', format: 'string' })
  })
})

describe('createTypeArray', () => {
  it('creates an array type', () => {
    const node = createTypeArray({ elements: [createTypeKeyword({ keyword: 'string' })], arrayType: 'array' })

    expect(node).toStrictEqual({ kind: 'TypeArray', elements: [{ kind: 'TypeKeyword', keyword: 'string' }], arrayType: 'array' })
  })
})

describe('createTypeUnion', () => {
  it('creates a union type', () => {
    const node = createTypeUnion({ members: [createTypeKeyword({ keyword: 'string' }), createTypeKeyword({ keyword: 'number' })] })

    expect(node).toStrictEqual({
      kind: 'TypeUnion',
      members: [
        { kind: 'TypeKeyword', keyword: 'string' },
        { kind: 'TypeKeyword', keyword: 'number' },
      ],
    })
  })
})

describe('createTypeIntersection', () => {
  it('creates an intersection type', () => {
    const node = createTypeIntersection({ members: [createTypeReference({ name: 'A' }), createTypeReference({ name: 'B' })], withParentheses: true })

    expect(node).toStrictEqual({
      kind: 'TypeIntersection',
      members: [
        { kind: 'TypeReference', name: 'A' },
        { kind: 'TypeReference', name: 'B' },
      ],
      withParentheses: true,
    })
  })
})

describe('createTypeTuple', () => {
  it('creates a tuple type', () => {
    const node = createTypeTuple({ items: [createTypeKeyword({ keyword: 'string' })], min: 0 })

    expect(node).toStrictEqual({ kind: 'TypeTuple', items: [{ kind: 'TypeKeyword', keyword: 'string' }], min: 0 })
  })
})

describe('createTypeObject', () => {
  it('creates an object type with members and index signatures', () => {
    const node = createTypeObject({
      members: [{ name: 'id', type: createTypeKeyword({ keyword: 'number' }), optional: true }],
      indexSignatures: [{ type: createTypeKeyword({ keyword: 'unknown' }) }],
    })

    expect(node).toStrictEqual({
      kind: 'TypeObject',
      members: [{ name: 'id', type: { kind: 'TypeKeyword', keyword: 'number' }, optional: true }],
      indexSignatures: [{ type: { kind: 'TypeKeyword', keyword: 'unknown' } }],
    })
  })
})

describe('createTypeUrlTemplate', () => {
  it('creates a url template type', () => {
    expect(createTypeUrlTemplate({ path: '/pets/{petId}' })).toStrictEqual({ kind: 'TypeUrlTemplate', path: '/pets/{petId}' })
  })
})

describe('createTypeOmit', () => {
  it('creates an omit type', () => {
    const node = createTypeOmit({ type: createTypeReference({ name: 'Pet' }), keys: ['id'], nonNullable: true })

    expect(node).toStrictEqual({ kind: 'TypeOmit', type: { kind: 'TypeReference', name: 'Pet' }, keys: ['id'], nonNullable: true })
  })
})

describe('type IR node typing', () => {
  it('forces kind to TypeKeyword', () => {
    // @ts-expect-error — kind should be forced to 'TypeKeyword'
    const node = createTypeKeyword({ keyword: 'string', kind: 'TypeReference' })

    expect(node.kind).toBe('TypeKeyword')
  })

  it('narrows the return type to TypeIRNode', () => {
    expectTypeOf(createTypeKeyword({ keyword: 'string' })).toMatchTypeOf<TypeIRNode>()
  })
})

describe('isTypeIRNode', () => {
  it('returns true for type IR nodes', () => {
    expect(isTypeIRNode(createTypeKeyword({ keyword: 'string' }))).toBe(true)
    expect(isTypeIRNode(createTypeObject({ members: [] }))).toBe(true)
    expect(isTypeIRNode(createTypeReference({ name: 'Pet' }))).toBe(true)
  })

  it('returns false for non type IR nodes and non-nodes', () => {
    expect(isTypeIRNode(null)).toBe(false)
    expect(isTypeIRNode(undefined)).toBe(false)
    expect(isTypeIRNode({ kind: 'Identifier', name: 'z' })).toBe(false)
  })
})
