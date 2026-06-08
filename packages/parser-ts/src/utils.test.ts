import { createArrowFunction, createBreak, createConst, createFunction, createSource, createText, createType } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import {
  dedent,
  formatGenerics,
  formatReturnType,
  getRelativePath,
  indentLines,
  printArrowFunction,
  printCodeNode,
  printConst,
  printFunction,
  printJSDoc,
  printNodes,
  printSource,
  printType,
  resolveOutputPath,
  slash,
  trimExtName,
} from './utils.ts'

describe('slash', () => {
  it('converts backslashes to forward slashes', () => {
    expect(slash('foo\\bar\\baz')).toBe('foo/bar/baz')
  })

  it('leaves forward-slash paths unchanged', () => {
    expect(slash('foo/bar/baz')).toBe('foo/bar/baz')
  })

  it('strips a leading ../ segment', () => {
    expect(slash('../foo/bar')).toBe('foo/bar')
  })
})

describe('trimExtName', () => {
  it('removes a simple extension', () => {
    expect(trimExtName('foo.ts')).toBe('foo')
  })

  it('removes only the last extension', () => {
    expect(trimExtName('foo.bar.ts')).toBe('foo.bar')
  })

  it('returns the original when there is no extension', () => {
    expect(trimExtName('foo')).toBe('foo')
  })
})

describe('getRelativePath', () => {
  it('returns a ./ prefixed path for a file inside the root', () => {
    const result = getRelativePath('/root/src', '/root/src/models/pet.ts')
    expect(result).toBe('./models/pet.ts')
  })
})

describe('resolveOutputPath', () => {
  it('replaces the extension when options.extname is set', () => {
    expect(resolveOutputPath('src/pet.ts', { extname: '.js' }, false)).toBe('src/pet.js')
  })

  it('strips the extension when rootAware is true and no extname given', () => {
    expect(resolveOutputPath('src/pet.ts', undefined, true)).toBe('src/pet')
  })

  it('leaves the path unchanged when no extension and not rootAware', () => {
    expect(resolveOutputPath('zod', undefined, false)).toBe('zod')
  })
})

describe('indentLines', () => {
  it('indents each non-empty line by 2 spaces', () => {
    expect(indentLines('foo\nbar')).toBe('  foo\n  bar')
  })

  it('does not indent empty lines', () => {
    expect(indentLines('foo\n\nbar')).toBe('  foo\n\n  bar')
  })

  it('uses a custom indent size', () => {
    expect(indentLines('foo', 4)).toBe('    foo')
  })

  it('returns empty string for empty input', () => {
    expect(indentLines('')).toBe('')
  })
})

describe('dedent', () => {
  it('strips the common leading whitespace shared by every line', () => {
    expect(dedent('    foo\n      bar')).toBe('foo\n  bar')
  })

  it('trims leading and trailing blank lines', () => {
    expect(dedent('\n\n  foo\n  bar\n\n')).toBe('foo\nbar')
  })

  it('outdents a single line', () => {
    expect(dedent('   x')).toBe('x')
  })

  it('leaves already-baselined content unchanged', () => {
    expect(dedent('foo\n  bar')).toBe('foo\n  bar')
  })

  it('keeps interior blank lines empty', () => {
    expect(dedent('  foo\n\n  bar')).toBe('foo\n\nbar')
  })

  it('returns empty string for empty input', () => {
    expect(dedent('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(dedent('   \n  ')).toBe('')
  })

  it('counts a tab as a single indent unit', () => {
    expect(dedent('\t\tfoo\n\t\t\tbar')).toBe('foo\n\tbar')
  })
})

describe('formatGenerics', () => {
  it('returns empty string when no generics', () => {
    expect(formatGenerics(undefined)).toBe('')
  })

  it('renders an array of type parameters', () => {
    expect(formatGenerics(['T', 'U'])).toBe('<T, U>')
  })

  it('renders a raw string verbatim', () => {
    expect(formatGenerics('T extends string')).toBe('<T extends string>')
  })
})

describe('formatReturnType', () => {
  it('returns empty string when no return type', () => {
    expect(formatReturnType(undefined, false)).toBe('')
  })

  it('renders a plain return type', () => {
    expect(formatReturnType('Pet', false)).toBe(': Pet')
  })

  it('wraps in Promise when isAsync is true', () => {
    expect(formatReturnType('Pet', true)).toBe(': Promise<Pet>')
  })
})

describe('printNodes', () => {
  it('returns empty string for undefined nodes', () => {
    expect(printNodes(undefined)).toBe('')
  })

  it('returns empty string for empty nodes array', () => {
    expect(printNodes([])).toBe('')
  })

  it('joins multiple nodes with newline', () => {
    const nodes = [createText('const x = 1'), createText('const y = 2')]
    expect(printNodes(nodes)).toBe('const x = 1\nconst y = 2')
  })
})

describe('printJSDoc', () => {
  it('returns empty string when no comments', () => {
    expect(printJSDoc({ comments: [] })).toBe('')
    expect(printJSDoc({ comments: [undefined] })).toBe('')
  })

  it('renders a single-line comment', () => {
    expect(printJSDoc({ comments: ['@description A pet'] })).toBe('/**\n * @description A pet\n */')
  })

  it('renders multiple comments', () => {
    const result = printJSDoc({
      comments: ['@description A pet', '@deprecated'],
    })
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
    const node = createConst({ name: 'pet', nodes: [createText('{}')] })
    expect(printConst(node)).toBe('const pet = {}')
  })

  it('generates an exported const', () => {
    const node = createConst({
      name: 'pet',
      export: true,
      nodes: [createText('{}')],
    })
    expect(printConst(node)).toBe('export const pet = {}')
  })

  it('generates a typed const', () => {
    const node = createConst({
      name: 'pet',
      type: 'Pet',
      nodes: [createText('{}')],
    })
    expect(printConst(node)).toBe('const pet: Pet = {}')
  })

  it('generates a const with asConst', () => {
    const node = createConst({
      name: 'pets',
      export: true,
      type: 'Pet[]',
      asConst: true,
      nodes: [createText('[]')],
    })
    expect(printConst(node)).toBe('export const pets: Pet[] = [] as const')
  })

  it('includes JSDoc when provided', () => {
    const node = createConst({
      name: 'pet',
      JSDoc: { comments: ['@description A pet'] },
      nodes: [createText('{}')],
    })
    expect(printConst(node)).toBe('/**\n * @description A pet\n */\nconst pet = {}')
  })

  it('normalizes a multi-line value authored with baked-in indentation', () => {
    const node = createConst({
      name: 'pet',
      export: true,
      nodes: [createText('\n    {\n      foo: 1,\n      bar: 2,\n    }\n  ')],
    })
    expect(printConst(node)).toBe('export const pet = {\n  foo: 1,\n  bar: 2,\n}')
  })

  it('preserves a correctly authored multi-line value', () => {
    const node = createConst({
      name: 'pet',
      export: true,
      nodes: [createText('{\n  foo: 1,\n  bar: 2,\n}')],
    })
    expect(printConst(node)).toBe('export const pet = {\n  foo: 1,\n  bar: 2,\n}')
  })
})

describe('printType', () => {
  it('generates a minimal type alias', () => {
    const node = createType({
      name: 'Pet',
      nodes: [createText('{ id: number }')],
    })
    expect(printType(node)).toBe('type Pet = { id: number }')
  })

  it('generates an exported type alias', () => {
    const node = createType({
      name: 'Pet',
      export: true,
      nodes: [createText('{ id: number }')],
    })
    expect(printType(node)).toBe('export type Pet = { id: number }')
  })

  it('includes JSDoc when provided', () => {
    const node = createType({
      name: 'PetStatus',
      export: true,
      JSDoc: { comments: ['@description Status of a pet'] },
      nodes: [createText('string')],
    })
    expect(printType(node)).toBe('/**\n * @description Status of a pet\n */\nexport type PetStatus = string')
  })

  it('handles empty nodes', () => {
    const node = createType({ name: 'Pet' })
    expect(printType(node)).toBe('type Pet = ')
  })

  it('normalizes a multi-line object type authored with baked-in indentation', () => {
    const node = createType({
      name: 'Pet',
      export: true,
      nodes: [createText('\n    {\n      id: number\n      name: string\n    }\n  ')],
    })
    expect(printType(node)).toBe('export type Pet = {\n  id: number\n  name: string\n}')
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
    const node = createFunction({
      name: 'fetchPet',
      export: true,
      async: true,
      returnType: 'Pet',
    })
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
    const node = createFunction({
      name: 'identity',
      generics: ['T'],
      params: 'value: T',
      returnType: 'T',
    })
    expect(printFunction(node)).toBe('function identity<T>(value: T): T {}')
  })

  it('generates a function with generics as string', () => {
    const node = createFunction({
      name: 'identity',
      generics: 'T extends string',
      params: 'value: T',
      returnType: 'T',
    })
    expect(printFunction(node)).toBe('function identity<T extends string>(value: T): T {}')
  })

  it('generates a default export function', () => {
    const node = createFunction({
      name: 'handler',
      default: true,
      export: true,
    })
    expect(printFunction(node)).toBe('export default function handler() {}')
  })

  it('generates a function with body', () => {
    const node = createFunction({
      name: 'getPet',
      nodes: [createText('return fetch("/pets")')],
    })
    expect(printFunction(node)).toBe('function getPet() {\n  return fetch("/pets")\n}')
  })

  it('includes JSDoc when provided', () => {
    const node = createFunction({
      name: 'getPet',
      JSDoc: { comments: ['@description Fetch a pet'] },
    })
    expect(printFunction(node)).toBe('/**\n * @description Fetch a pet\n */\nfunction getPet() {}')
  })

  it('normalizes a body authored with baked-in indentation to a single level', () => {
    const node = createFunction({
      name: 'getPet',
      nodes: [createText('      const a = 1\n      const b = 2')],
    })
    expect(printFunction(node)).toBe('function getPet() {\n  const a = 1\n  const b = 2\n}')
  })

  it('indents a nested function cumulatively', () => {
    const inner = createFunction({ name: 'inner', nodes: [createText('return 1')] })
    const node = createFunction({ name: 'outer', nodes: [inner] })
    expect(printFunction(node)).toBe('function outer() {\n  function inner() {\n    return 1\n  }\n}')
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
    const node = createArrowFunction({
      name: 'fetchPet',
      export: true,
      async: true,
      returnType: 'Pet',
    })
    expect(printArrowFunction(node)).toBe('export const fetchPet = async (): Promise<Pet> => {}')
  })

  it('generates a single-line arrow function', () => {
    const node = createArrowFunction({
      name: 'double',
      params: 'n: number',
      singleLine: true,
      nodes: [createText('n * 2')],
    })
    expect(printArrowFunction(node)).toBe('const double = (n: number) => n * 2')
  })

  it('generates an arrow function with body', () => {
    const node = createArrowFunction({
      name: 'getPet',
      nodes: [createText('return fetch("/pets")')],
    })
    expect(printArrowFunction(node)).toBe('const getPet = () => {\n  return fetch("/pets")\n}')
  })

  it('generates an arrow function with generics', () => {
    const node = createArrowFunction({
      name: 'identity',
      generics: ['T'],
      params: 'value: T',
      returnType: 'T',
      singleLine: true,
      nodes: [createText('value')],
    })
    expect(printArrowFunction(node)).toBe('const identity = <T>(value: T): T => value')
  })

  it('generates an async arrow function with generics', () => {
    const node = createArrowFunction({
      name: 'fetchPet',
      async: true,
      generics: ['T'],
      params: 'id: string',
      returnType: 'T',
    })
    expect(printArrowFunction(node)).toBe('const fetchPet = async <T>(id: string): Promise<T> => {}')
  })

  it('includes JSDoc when provided', () => {
    const node = createArrowFunction({
      name: 'getPet',
      JSDoc: { comments: ['@description Fetch a pet'] },
    })
    expect(printArrowFunction(node)).toBe('/**\n * @description Fetch a pet\n */\nconst getPet = () => {}')
  })

  it('normalizes a body authored with baked-in indentation to a single level', () => {
    const node = createArrowFunction({
      name: 'getPet',
      nodes: [createText('      const a = 1\n      const b = 2')],
    })
    expect(printArrowFunction(node)).toBe('const getPet = () => {\n  const a = 1\n  const b = 2\n}')
  })
})

describe('printCodeNode', () => {
  it('dispatches Const nodes', () => {
    const node = createConst({ name: 'x', nodes: [createText('1')] })
    expect(printCodeNode(node)).toBe('const x = 1')
  })

  it('dispatches Type nodes', () => {
    const node = createType({
      name: 'Pet',
      nodes: [createText('{ id: number }')],
    })
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
  it('converts nodes to source string', () => {
    const node = createSource({ nodes: [createText('const x = 1')] })
    expect(printSource(node)).toBe('const x = 1')
  })

  it('converts nodes when source has structured nodes', () => {
    const node = createSource({
      nodes: [createConst({ name: 'x', nodes: [createText('1')] })],
    })
    expect(printSource(node)).toBe('const x = 1')
  })

  it('separates multiple top-level declarations with a blank line', () => {
    const node = createSource({
      nodes: [createConst({ name: 'x', nodes: [createText('1')] }), createType({ name: 'Pet', nodes: [createText('{ id: number }')] })],
    })
    expect(printSource(node)).toBe('const x = 1\n\ntype Pet = { id: number }')
  })

  it('preserves DOM order when JSX elements and text nodes are interleaved', () => {
    const node = createSource({
      nodes: [
        createConst({ name: 'server', nodes: [createText('new McpServer()')] }),
        createText('server.registerTool("foo", {})'),
        createConst({ name: 'x', nodes: [createText('1')] }),
      ],
    })
    expect(printSource(node)).toBe('const server = new McpServer()\n\nserver.registerTool("foo", {})\n\nconst x = 1')
  })

  it('normalizes a top-level text node with baked-in indentation to column zero', () => {
    const node = createSource({ nodes: [createText('    const x = 1')] })
    expect(printSource(node)).toBe('const x = 1')
  })

  it('does not add an extra blank line for an explicit break', () => {
    const node = createSource({
      nodes: [createConst({ name: 'x', nodes: [createText('1')] }), createBreak(), createConst({ name: 'y', nodes: [createText('2')] })],
    })
    expect(printSource(node)).toBe('const x = 1\n\nconst y = 2')
  })

  it('returns empty string when source has no nodes', () => {
    const node = createSource({})
    expect(printSource(node)).toBe('')
  })
})
