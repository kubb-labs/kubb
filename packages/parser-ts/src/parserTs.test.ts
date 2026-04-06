import { createArrowFunction, createConst, createFile, createFunction, createSource, createType } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { parserTs, printArrowFunction, printCodeNode, printConst, printFunction, printJSDoc, printSource, printType } from './parserTs.ts'

describe('printJSDoc', () => {
  it('returns empty string when no comments', () => {
    expect(printJSDoc({ comments: [] })).toBe('')
    expect(printJSDoc({ comments: [undefined] })).toBe('')
  })

  it('renders a single-line comment', () => {
    expect(printJSDoc({ comments: ['@description A pet'] })).toBe('/**\n * @description A pet\n */')
  })

  it('renders multiple comments', () => {
    const result = printJSDoc({ comments: ['@description A pet', '@deprecated'] })
    expect(result).toBe('/**\n * @description A pet\n * @deprecated\n */')
  })

  it('splits multi-line comment strings', () => {
    const result = printJSDoc({ comments: ['line one\nline two'] })
    expect(result).toBe('/**\n * line one\n * line two\n */')
  })

  it('escapes */ in comment content', () => {
    const result = printJSDoc({ comments: ['see */ here'] })
    expect(result).toBe('/**\n * see * / here\n */')
  })
})

describe('printConst', () => {
  it('generates a minimal const declaration', () => {
    const node = createConst({ name: 'pet', nodes: ['{}'] })
    expect(printConst(node)).toBe('const pet = {}')
  })

  it('generates an exported const', () => {
    const node = createConst({ name: 'pet', export: true, nodes: ['{}'] })
    expect(printConst(node)).toBe('export const pet = {}')
  })

  it('generates a typed const', () => {
    const node = createConst({ name: 'pet', type: 'Pet', nodes: ['{}'] })
    expect(printConst(node)).toBe('const pet: Pet = {}')
  })

  it('generates a const with asConst', () => {
    const node = createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true, nodes: ['[]'] })
    expect(printConst(node)).toBe('export const pets: Pet[] = [] as const')
  })

  it('includes JSDoc when provided', () => {
    const node = createConst({ name: 'pet', JSDoc: { comments: ['@description A pet'] }, nodes: ['{}'] })
    expect(printConst(node)).toBe('/**\n * @description A pet\n */\nconst pet = {}')
  })

  it('handles empty nodes (no value)', () => {
    const node = createConst({ name: 'pet' })
    expect(printConst(node)).toBe('const pet = ')
  })

  it('handles nested CodeNode as value', () => {
    const inner = createConst({ name: 'inner', nodes: ['1'] })
    const node = createConst({ name: 'outer', nodes: [inner] })
    expect(printConst(node)).toBe('const outer = const inner = 1')
  })
})

describe('printType', () => {
  it('generates a minimal type alias', () => {
    const node = createType({ name: 'Pet', nodes: ['{ id: number }'] })
    expect(printType(node)).toBe('type Pet = { id: number }')
  })

  it('generates an exported type alias', () => {
    const node = createType({ name: 'Pet', export: true, nodes: ['{ id: number }'] })
    expect(printType(node)).toBe('export type Pet = { id: number }')
  })

  it('includes JSDoc when provided', () => {
    const node = createType({ name: 'PetStatus', export: true, JSDoc: { comments: ['@description Status of a pet'] }, nodes: ['string'] })
    expect(printType(node)).toBe('/**\n * @description Status of a pet\n */\nexport type PetStatus = string')
  })

  it('handles empty nodes', () => {
    const node = createType({ name: 'Pet' })
    expect(printType(node)).toBe('type Pet = ')
  })
})

describe('printFunction', () => {
  it('generates a minimal function declaration', () => {
    const node = createFunction({ name: 'getPet' })
    expect(printFunction(node)).toBe('function getPet() {}')
  })

  it('generates an exported function', () => {
    const node = createFunction({ name: 'getPet', export: true })
    expect(printFunction(node)).toBe('export function getPet() {}')
  })

  it('generates an async function with Promise return type', () => {
    const node = createFunction({ name: 'fetchPet', export: true, async: true, returnType: 'Pet' })
    expect(printFunction(node)).toBe('export async function fetchPet(): Promise<Pet> {}')
  })

  it('generates a function with non-async return type', () => {
    const node = createFunction({ name: 'getPet', returnType: 'Pet' })
    expect(printFunction(node)).toBe('function getPet(): Pet {}')
  })

  it('generates a function with params', () => {
    const node = createFunction({ name: 'getPet', params: 'id: string' })
    expect(printFunction(node)).toBe('function getPet(id: string) {}')
  })

  it('generates a function with generics as array', () => {
    const node = createFunction({ name: 'identity', generics: ['T'], params: 'value: T', returnType: 'T' })
    expect(printFunction(node)).toBe('function identity<T>(value: T): T {}')
  })

  it('generates a function with generics as string', () => {
    const node = createFunction({ name: 'identity', generics: 'T extends string', params: 'value: T', returnType: 'T' })
    expect(printFunction(node)).toBe('function identity<T extends string>(value: T): T {}')
  })

  it('generates a default export function', () => {
    const node = createFunction({ name: 'handler', default: true, export: true })
    expect(printFunction(node)).toBe('export default function handler() {}')
  })

  it('generates a function with body', () => {
    const node = createFunction({ name: 'getPet', nodes: ['return fetch("/pets")'] })
    expect(printFunction(node)).toBe('function getPet() {\n  return fetch("/pets")\n}')
  })

  it('includes JSDoc when provided', () => {
    const node = createFunction({ name: 'getPet', JSDoc: { comments: ['@description Fetch a pet'] } })
    expect(printFunction(node)).toBe('/**\n * @description Fetch a pet\n */\nfunction getPet() {}')
  })
})

describe('printArrowFunction', () => {
  it('generates a minimal arrow function', () => {
    const node = createArrowFunction({ name: 'getPet' })
    expect(printArrowFunction(node)).toBe('const getPet = () => {}')
  })

  it('generates an exported arrow function', () => {
    const node = createArrowFunction({ name: 'getPet', export: true })
    expect(printArrowFunction(node)).toBe('export const getPet = () => {}')
  })

  it('generates an async arrow function with Promise return type', () => {
    const node = createArrowFunction({ name: 'fetchPet', export: true, async: true, returnType: 'Pet' })
    expect(printArrowFunction(node)).toBe('export const fetchPet = async (): Promise<Pet> => {}')
  })

  it('generates a single-line arrow function', () => {
    const node = createArrowFunction({ name: 'double', params: 'n: number', singleLine: true, nodes: ['n * 2'] })
    expect(printArrowFunction(node)).toBe('const double = (n: number) => n * 2')
  })

  it('generates an arrow function with body', () => {
    const node = createArrowFunction({ name: 'getPet', nodes: ['return fetch("/pets")'] })
    expect(printArrowFunction(node)).toBe('const getPet = () => {\n  return fetch("/pets")\n}')
  })

  it('generates an arrow function with generics', () => {
    const node = createArrowFunction({ name: 'identity', generics: ['T'], params: 'value: T', returnType: 'T', singleLine: true, nodes: ['value'] })
    expect(printArrowFunction(node)).toBe('const identity = <T>(value: T): T => value')
  })

  it('generates an async arrow function with generics', () => {
    const node = createArrowFunction({ name: 'fetchPet', async: true, generics: ['T'], params: 'id: string', returnType: 'T' })
    expect(printArrowFunction(node)).toBe('const fetchPet = async <T>(id: string): Promise<T> => {}')
  })

  it('includes JSDoc when provided', () => {
    const node = createArrowFunction({ name: 'getPet', JSDoc: { comments: ['@description Fetch a pet'] } })
    expect(printArrowFunction(node)).toBe('/**\n * @description Fetch a pet\n */\nconst getPet = () => {}')
  })
})

describe('printCodeNode', () => {
  it('dispatches Const nodes', () => {
    const node = createConst({ name: 'x', nodes: ['1'] })
    expect(printCodeNode(node)).toBe('const x = 1')
  })

  it('dispatches Type nodes', () => {
    const node = createType({ name: 'Pet', nodes: ['{ id: number }'] })
    expect(printCodeNode(node)).toBe('type Pet = { id: number }')
  })

  it('dispatches Function nodes', () => {
    const node = createFunction({ name: 'foo' })
    expect(printCodeNode(node)).toBe('function foo() {}')
  })

  it('dispatches ArrowFunction nodes', () => {
    const node = createArrowFunction({ name: 'bar' })
    expect(printCodeNode(node)).toBe('const bar = () => {}')
  })
})

describe('printSource', () => {
  it('returns value when source has value', () => {
    const node = createSource({ value: 'const x = 1' })
    expect(printSource(node)).toBe('const x = 1')
  })

  it('converts nodes when source has no value', () => {
    const node = createSource({ nodes: [createConst({ name: 'x', nodes: ['1'] })] })
    expect(printSource(node)).toBe('const x = 1')
  })

  it('converts multiple nodes joining with newline', () => {
    const node = createSource({
      nodes: [createConst({ name: 'x', nodes: ['1'] }), createType({ name: 'Pet', nodes: ['{ id: number }'] })],
    })
    expect(printSource(node)).toBe('const x = 1\ntype Pet = { id: number }')
  })

  it('returns empty string when source has neither value nor nodes', () => {
    const node = createSource({})
    expect(printSource(node)).toBe('')
  })

  it('prefers value over nodes when both are present', () => {
    const node = createSource({ value: 'const x = 1', nodes: [createConst({ name: 'y', nodes: ['2'] })] })
    expect(printSource(node)).toBe('const x = 1')
  })
})

describe('parserTs', () => {
  it('parses a source with structured nodes', async () => {
    const file = createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        createSource({
          nodes: [
            createConst({ name: 'schema', export: true, nodes: ['z.string()'] }),
          ],
        }),
      ],
      imports: [],
      exports: [],
    })

    const result = await parserTs.parse(file, { extname: '.ts' })
    expect(result).toContain('export const schema = z.string()')
  })

  it('parses a source with type and const nodes', async () => {
    const file = createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        createSource({
          nodes: [
            createType({ name: 'Pet', export: true, nodes: ['{ id: number }'] }),
            createConst({ name: 'pet', export: true, nodes: ['{}'] }),
          ],
        }),
      ],
      imports: [],
      exports: [],
    })

    const result = await parserTs.parse(file, { extname: '.ts' })
    expect(result).toContain('export type Pet = { id: number }')
    expect(result).toContain('export const pet = {}')
  })
})
