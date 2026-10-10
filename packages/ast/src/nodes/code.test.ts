import { describe, expect, it } from 'vitest'
import { createArrowFunction, createConst, createFunction, createText, createType } from './code.ts'

const JSDoc = { comments: ['@description A pet'] }
const nodes = [createText('x')]

const constInput = { name: 'pet', export: true, type: 'Pet[]', asConst: true, JSDoc, nodes }
const typeInput = { name: 'Pet', export: true, JSDoc, nodes }
const functionInput = { name: 'getPet', export: true, default: true, async: true, params: 'id: string', returnType: 'Pet', generics: ['T'], JSDoc, nodes }
const arrowFunctionInput = {
  name: 'double',
  export: true,
  default: true,
  async: false,
  params: 'n: number',
  returnType: 'number',
  generics: 'T',
  singleLine: true,
  JSDoc,
  nodes,
}

describe('code factories', () => {
  it.each([
    { kind: 'Const', input: constInput, node: createConst(constInput) },
    { kind: 'Type', input: typeInput, node: createType(typeInput) },
    { kind: 'Function', input: functionInput, node: createFunction(functionInput) },
    { kind: 'ArrowFunction', input: arrowFunctionInput, node: createArrowFunction(arrowFunctionInput) },
  ])('returns { kind: $kind, ...input } when creating a $kind node', ({ kind, input, node }) => {
    expect(node).toStrictEqual({ kind, ...input })
  })

  it('returns the factory kind when the input carries another kind', () => {
    const input = { name: 'x', kind: 'Import' }

    expect(createConst(input).kind).toBe('Const')
    expect(createType(input).kind).toBe('Type')
    expect(createFunction(input).kind).toBe('Function')
    expect(createArrowFunction(input).kind).toBe('ArrowFunction')
  })
})
