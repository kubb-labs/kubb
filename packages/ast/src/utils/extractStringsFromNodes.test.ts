import { describe, expect, it } from 'vitest'
import { createConst, createText } from '../nodes/code.ts'
import { createArray, createAs, createCall, createIdentifier, createLiteral, createMember, createObject, createRaw, createSpread } from '../nodes/expression.ts'
import { extractStringsFromNodes } from './extractStringsFromNodes.ts'

describe('extractStringsFromNodes', () => {
  it('returns empty string for empty input', () => {
    expect(extractStringsFromNodes(undefined)).toBe('')
    expect(extractStringsFromNodes([])).toBe('')
  })

  it('extracts text node values', () => {
    expect(extractStringsFromNodes([createText('z.string()')])).toBe('z.string()')
  })

  it('extracts declaration string fields and nested nodes', () => {
    const node = createConst({ name: 'x', type: 'Pet', nodes: [createText('value')] })

    expect(extractStringsFromNodes([node])).toBe('Pet\nvalue')
  })

  it('extracts an identifier name', () => {
    expect(extractStringsFromNodes([createIdentifier({ name: 'Pet' })])).toBe('Pet')
  })

  it('ignores literal values', () => {
    expect(extractStringsFromNodes([createLiteral({ value: 'active' })])).toBe('')
  })

  it('extracts the object of a member access, not the property name', () => {
    const node = createCall({ callee: createMember({ object: createIdentifier({ name: 'Pet' }), property: 'optional' }), args: [] })

    expect(extractStringsFromNodes([node])).toBe('Pet')
  })

  it('extracts call args and typeArgs', () => {
    const node = createCall({ callee: createIdentifier({ name: 'arrayElement' }), args: [createIdentifier({ name: 'Pet' })], typeArgs: ['Category'] })

    expect(extractStringsFromNodes([node])).toBe('arrayElement\nPet\nCategory')
  })

  it('extracts object property values and spreads, ignoring keys', () => {
    const node = createObject({
      properties: [
        { type: 'prop', key: 'id', value: createIdentifier({ name: 'Id' }) },
        { type: 'spread', expression: createIdentifier({ name: 'Base' }) },
      ],
    })

    expect(extractStringsFromNodes([node])).toBe('Id\nBase')
  })

  it('extracts array elements', () => {
    const node = createArray({ elements: [createIdentifier({ name: 'A' }), createIdentifier({ name: 'B' })] })

    expect(extractStringsFromNodes([node])).toBe('A\nB')
  })

  it('extracts a spread expression', () => {
    expect(extractStringsFromNodes([createSpread({ expression: createIdentifier({ name: 'rest' }) })])).toBe('rest')
  })

  it('extracts the As expression and target type', () => {
    const node = createAs({ expression: createIdentifier({ name: 'value' }), type: 'Blob' })

    expect(extractStringsFromNodes([node])).toBe('value\nBlob')
  })

  it('passes through raw expressions', () => {
    expect(extractStringsFromNodes([createRaw('faker.helpers.foo()')])).toBe('faker.helpers.foo()')
  })
})
