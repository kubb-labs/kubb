import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { getRelativePath, print as printFragments, printExport, printImport, printSource } from './utils.ts'

function print(...nodes: Array<ast.CodeNode>): string {
  return printSource(ast.factory.createSource({ nodes }))
}

describe('getRelativePath', () => {
  it('returns a ../ path when the target sits outside the importing file directory', () => {
    expect(getRelativePath('/root/src/models/pet.ts', '/root/lib/client.ts')).toBe('../../lib/client.ts')
  })
})

describe('text nodes', () => {
  it.each([
    { when: 'every line shares leading whitespace', input: '    foo\n      bar', expected: 'foo\n  bar' },
    { when: 'the text has leading and trailing blank lines', input: '\n\n  foo\n  bar\n\n', expected: 'foo\nbar' },
    { when: 'the text is already at column zero', input: 'foo\n  bar', expected: 'foo\n  bar' },
    { when: 'the text has interior blank lines', input: '  foo\n\n  bar', expected: 'foo\n\nbar' },
    { when: 'an interior line is whitespace only', input: '  foo\n \n  bar', expected: 'foo\n\nbar' },
    { when: 'the text is whitespace only', input: '   \n  ', expected: '' },
    { when: 'the indent uses tabs', input: '\t\tfoo\n\t\t\tbar', expected: 'foo\n\tbar' },
  ])('returns $expected when $when', ({ input, expected }) => {
    expect(print(ast.factory.createText(input))).toBe(expected)
  })
})

describe('function bodies', () => {
  const x = ast.factory.createText('const x = 1')
  const y = ast.factory.createText('const y = 2')
  const br = ast.factory.createBreak()

  it.each([
    { when: 'nodes follow each other', nodes: [x, y], expected: 'function f() {\n  const x = 1\n  const y = 2\n}' },
    { when: 'a break sits between nodes', nodes: [x, br, y], expected: 'function f() {\n  const x = 1\n\n  const y = 2\n}' },
    { when: 'breaks lead and trail the nodes', nodes: [br, x, br], expected: 'function f() {\n  const x = 1\n}' },
  ])('returns $expected when $when', ({ nodes, expected }) => {
    expect(printSource(ast.factory.createSource({ nodes: [ast.factory.createFunction({ name: 'f', nodes })] }))).toBe(expected)
  })
})

describe('JSDoc', () => {
  it.each([
    { when: 'comments holds only undefined', comments: [undefined], expected: 'const x = 1' },
    {
      when: 'there are several comments',
      comments: ['@description A pet', '@deprecated'],
      expected: '/**\n * @description A pet\n * @deprecated\n */\nconst x = 1',
    },
    { when: 'a comment spans lines', comments: ['line one\nline two'], expected: '/**\n * line one\n * line two\n */\nconst x = 1' },
    { when: 'a comment contains */', comments: ['see */ here'], expected: '/**\n * see * / here\n */\nconst x = 1' },
  ])('returns $expected when $when', ({ comments, expected }) => {
    expect(print(ast.factory.createConst({ name: 'x', JSDoc: { comments }, nodes: [ast.factory.createText('1')] }))).toBe(expected)
  })
})

describe('Const nodes', () => {
  it('returns an as const declaration when asConst is set', () => {
    const node = ast.factory.createConst({
      name: 'pets',
      export: true,
      type: 'Pet[]',
      asConst: true,
      nodes: [ast.factory.createText('[]')],
    })
    expect(print(node)).toBe('export const pets: Pet[] = [] as const')
  })
})

describe('Function nodes', () => {
  it.each([
    { when: 'generics is an array', node: { generics: ['T'], params: 'value: T', returnType: 'T' }, expected: 'function getPet<T>(value: T): T {}' },
    {
      when: 'generics is a string',
      node: { generics: 'T extends string', params: 'value: T', returnType: 'T' },
      expected: 'function getPet<T extends string>(value: T): T {}',
    },
  ])('returns $expected when $when', ({ node, expected }) => {
    expect(print(ast.factory.createFunction({ name: 'getPet', ...node }))).toBe(expected)
  })

  it('returns a Promise return type when async is set', () => {
    const node = ast.factory.createFunction({
      name: 'fetchPet',
      export: true,
      async: true,
      returnType: 'Pet',
    })
    expect(print(node)).toBe('export async function fetchPet(): Promise<Pet> {}')
  })

  it('returns a default export when default and export are set', () => {
    const node = ast.factory.createFunction({
      name: 'handler',
      default: true,
      export: true,
    })
    expect(print(node)).toBe('export default function handler() {}')
  })

  it('returns cumulative indentation when a function is nested', () => {
    const inner = ast.factory.createFunction({ name: 'inner', nodes: [ast.factory.createText('return 1')] })
    const node = ast.factory.createFunction({ name: 'outer', nodes: [inner] })
    expect(print(node)).toBe(['function outer() {', '  function inner() {', '    return 1', '  }', '}'].join('\n'))
  })
})

describe('ArrowFunction nodes', () => {
  it.each([
    {
      when: 'the function is single-line',
      node: { singleLine: true, nodes: [ast.factory.createText('value')] },
      expected: 'const identity = <T>(value: T): T => value',
    },
    { when: 'the function is async', node: { async: true }, expected: 'const identity = async <T>(value: T): Promise<T> => {}' },
  ])('returns $expected when generics are set and $when', ({ node, expected }) => {
    expect(print(ast.factory.createArrowFunction({ name: 'identity', generics: ['T'], params: 'value: T', returnType: 'T', ...node }))).toBe(expected)
  })

  it('returns an indented block body when nodes are set', () => {
    const node = ast.factory.createArrowFunction({
      name: 'getPet',
      nodes: [ast.factory.createText('return fetch("/pets")')],
    })
    expect(print(node)).toBe(['const getPet = () => {', '  return fetch("/pets")', '}'].join('\n'))
  })
})

describe('printSource', () => {
  it('returns nodes in DOM order when declarations and text nodes are interleaved', () => {
    const node = ast.factory.createSource({
      nodes: [
        ast.factory.createConst({ name: 'server', nodes: [ast.factory.createText('new McpServer()')] }),
        ast.factory.createText('server.registerTool("foo", {})'),
        ast.factory.createConst({ name: 'x', nodes: [ast.factory.createText('1')] }),
      ],
    })
    expect(printSource(node)).toBe(['const server = new McpServer()', '', 'server.registerTool("foo", {})', '', 'const x = 1'].join('\n'))
  })
})

describe('printImport', () => {
  it.each([
    { when: 'name is a list', node: { name: ['z'], path: './zod.ts' }, expected: "import { z } from './zod.ts'" },
    {
      when: 'a name is aliased',
      node: { name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' },
      expected: "import { fakerDE as faker } from '@faker-js/faker'",
    },
    {
      when: 'name is a string',
      node: { name: 'client', path: '@kubb/plugin-axios/clients/axios' },
      expected: "import client from '@kubb/plugin-axios/clients/axios'",
    },
    { when: 'isNameSpace is set', node: { name: 'z', path: 'zod', isNameSpace: true }, expected: "import * as z from 'zod'" },
    { when: 'isTypeOnly is set', node: { name: ['Pet'], path: './Pet.ts', isTypeOnly: true }, expected: "import type { Pet } from './Pet.ts'" },
    { when: 'the path contains a quote', node: { name: ['z'], path: "./o'clock.ts" }, expected: "import { z } from './o\\'clock.ts'" },
  ])('returns $expected when $when', ({ node, expected }) => {
    expect(printImport(node)).toBe(expected)
  })
})

describe('printExport', () => {
  it.each([
    { when: 'name is a list', node: { name: ['Pet', 'Order'], path: './models.ts' }, expected: "export { Pet, Order } from './models.ts'" },
    { when: 'name is absent', node: { path: './utils.ts' }, expected: "export * from './utils.ts'" },
    { when: 'asAlias is set', node: { name: 'utils', path: './utils.ts', asAlias: true }, expected: "export * as utils from './utils.ts'" },
    {
      when: 'the alias starts with a digit',
      node: { name: '1default', path: './default.ts', asAlias: true },
      expected: "export * as _default from './default.ts'",
    },
    { when: 'isTypeOnly is set', node: { name: ['Pet'], path: './Pet.ts', isTypeOnly: true }, expected: "export type { Pet } from './Pet.ts'" },
    { when: 'name is a string', node: { name: 'Pet', path: './Pet.ts' }, expected: "export { Pet } from './Pet.ts'" },
  ])('returns $expected when $when', ({ node, expected }) => {
    expect(printExport(node)).toBe(expected)
  })
})

describe('print', () => {
  it('joins string fragments with a newline', () => {
    expect(printFragments('type A = string', 'type B = number')).toBe('type A = string\ntype B = number')
  })

  it('asks for a TypeScript with the compiler API when it gets a compiler node and none is installed', () => {
    expect(() => printFragments({ kind: 1 })).toThrow('needs `typescript` 5 or 6')
  })
})
