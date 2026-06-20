import { ast } from '@kubb/ast'
import type { TypeIRNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { typeIRToNode } from './typeFactory.ts'
import { print } from './utils.ts'

const keyword = (name: Parameters<typeof ast.factory.createTypeKeyword>[0]['keyword']) => ast.factory.createTypeKeyword({ keyword: name })

// `print` appends the trailing newline its list printer always adds; `parserTs.parse` trims it
// downstream, so the meaningful output is the trimmed string.
const printType = (node: TypeIRNode) => print(typeIRToNode(node)).trimEnd()

describe('typeIRToNode', () => {
  it('renders keyword types', () => {
    expect(printType(keyword('string'))).toBe('string')
    expect(printType(keyword('number'))).toBe('number')
    expect(printType(keyword('integer'))).toBe('number')
    expect(printType(keyword('boolean'))).toBe('boolean')
    expect(printType(keyword('null'))).toBe('null')
    expect(printType(keyword('never'))).toBe('never')
    expect(printType(keyword('unknown'))).toBe('unknown')
  })

  it('renders a type reference', () => {
    expect(printType(ast.factory.createTypeReference({ name: 'Pet' }))).toBe('Pet')
  })

  it('renders a generic type reference', () => {
    expect(printType(ast.factory.createTypeReference({ name: 'Record', typeArgs: [keyword('string'), keyword('number')] }))).toBe('Record<string, number>')
  })

  it('renders an array with bracket syntax', () => {
    expect(printType(ast.factory.createTypeArray({ elements: [keyword('string')] }))).toBe('string[]')
  })

  it('renders an array with generic syntax', () => {
    expect(printType(ast.factory.createTypeArray({ elements: [keyword('number')], arrayType: 'generic' }))).toBe('Array<number>')
  })

  it('parenthesizes a union element for bracket syntax', () => {
    expect(printType(ast.factory.createTypeArray({ elements: [keyword('string'), keyword('number')] }))).toBe('(string | number)[]')
  })

  it('renders a union', () => {
    expect(printType(ast.factory.createTypeUnion({ members: [keyword('string'), keyword('number')] }))).toBe('string | number')
  })

  it('renders a nested parenthesized union', () => {
    const inner = ast.factory.createTypeUnion({ members: [keyword('number'), keyword('boolean')], withParentheses: true })
    expect(printType(ast.factory.createTypeUnion({ members: [keyword('string'), inner] }))).toBe('string | (number | boolean)')
  })

  it('renders an intersection', () => {
    const node = ast.factory.createTypeIntersection({
      members: [ast.factory.createTypeReference({ name: 'A' }), ast.factory.createTypeReference({ name: 'B' })],
    })
    expect(printType(node)).toBe('A & B')
  })

  it('renders a tuple with trailing optional elements', () => {
    // The TypeScript printer emits synthesized tuple types multiline; downstream formatting collapses them.
    expect(printType(ast.factory.createTypeTuple({ items: [keyword('string'), keyword('number'), keyword('boolean')], min: 1 }))).toMatchInlineSnapshot(`
      "[
          string,
          number?,
          boolean?
      ]"
    `)
  })

  it('renders a tuple with a rest element', () => {
    expect(printType(ast.factory.createTypeTuple({ items: [keyword('string')], rest: keyword('number') }))).toMatchInlineSnapshot(`
      "[
          string,
          ...number[]
      ]"
    `)
  })

  it('renders literal types', () => {
    expect(printType(ast.factory.createTypeLiteralType({ value: 'active', format: 'string' }))).toBe('"active"')
    expect(printType(ast.factory.createTypeLiteralType({ value: 200, format: 'number' }))).toBe('200')
    expect(printType(ast.factory.createTypeLiteralType({ value: -1, format: 'number' }))).toBe('-1')
    expect(printType(ast.factory.createTypeLiteralType({ value: true, format: 'boolean' }))).toBe('true')
  })

  it('renders Omit, optionally wrapped in NonNullable', () => {
    const pet = ast.factory.createTypeReference({ name: 'Pet' })
    expect(printType(ast.factory.createTypeOmit({ type: pet, keys: ['name'], nonNullable: true }))).toBe('Omit<NonNullable<Pet>, "name">')
    expect(printType(ast.factory.createTypeOmit({ type: pet, keys: ['id', 'name'] }))).toBe('Omit<Pet, "id" | "name">')
  })

  it('renders a URL template literal type', () => {
    expect(printType(ast.factory.createTypeUrlTemplate({ path: '/pets/{petId}' }))).toBe('`/pets/${string}`')
  })

  it('renders an object type literal', () => {
    const node = ast.factory.createTypeObject({
      members: [
        { name: 'id', type: keyword('number') },
        { name: 'name', type: keyword('string'), optional: true },
      ],
    })
    expect(printType(node)).toMatchInlineSnapshot(`
      "{
          id: number;
          name?: string;
      }"
    `)
  })

  it('renders an object type with a readonly member and an index signature', () => {
    const node = ast.factory.createTypeObject({
      members: [{ name: 'id', type: keyword('number'), readOnly: true }],
      indexSignatures: [{ type: keyword('unknown') }],
    })
    expect(printType(node)).toMatchInlineSnapshot(`
      "{
          readonly id: number;
          [key: string]: unknown;
      }"
    `)
  })

  it('attaches JSDoc to an object member', () => {
    const node = ast.factory.createTypeObject({
      members: [{ name: 'id', type: keyword('number'), jsDoc: ['@description The id'] }],
    })
    expect(printType(node)).toMatchInlineSnapshot(`
      "{
          /**
           * @description The id
          */
          id: number;
      }"
    `)
  })
})
