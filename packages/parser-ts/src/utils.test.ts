import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import {
  dedent,
  getRelativePath,
  printArrowFunction,
  printCodeNode,
  printConst,
  printExport,
  printFunction,
  printImport,
  printJSDoc,
  printNodes,
  printSource,
  printType,
} from './utils.ts'

describe('getRelativePath', () => {
  it('returns a ./ path when the target sits beside the importing file', () => {
    expect(getRelativePath('/root/src/index.ts', '/root/src/models/pet.ts')).toBe('./models/pet.ts')
  })

  it('returns a ../ path when the target sits outside the importing file directory', () => {
    expect(getRelativePath('/root/src/models/pet.ts', '/root/lib/client.ts')).toBe('../../lib/client.ts')
  })
})

describe('dedent', () => {
  it.each([
    { when: 'every line shares leading whitespace', input: '    foo\n      bar', expected: 'foo\n  bar' },
    { when: 'the text has leading and trailing blank lines', input: '\n\n  foo\n  bar\n\n', expected: 'foo\nbar' },
    { when: 'the text is already at column zero', input: 'foo\n  bar', expected: 'foo\n  bar' },
    { when: 'the text has interior blank lines', input: '  foo\n\n  bar', expected: 'foo\n\nbar' },
    { when: 'the text is whitespace only', input: '   \n  ', expected: '' },
    { when: 'the indent uses tabs', input: '\t\tfoo\n\t\t\tbar', expected: 'foo\n\tbar' },
  ])('returns $expected when $when', ({ input, expected }) => {
    expect(dedent(input)).toBe(expected)
  })
})

describe('printNodes', () => {
  const x = ast.factory.createText('const x = 1')
  const y = ast.factory.createText('const y = 2')
  const br = ast.factory.createBreak()

  it.each([
    { when: 'nodes follow each other', nodes: [x, y], expected: 'const x = 1\nconst y = 2' },
    { when: 'a break sits between nodes', nodes: [x, br, y], expected: 'const x = 1\n\nconst y = 2' },
    { when: 'consecutive breaks sit between nodes', nodes: [x, br, br, y], expected: 'const x = 1\n\nconst y = 2' },
    { when: 'breaks lead and trail the nodes', nodes: [br, x, br], expected: 'const x = 1' },
  ])('returns $expected when $when', ({ nodes, expected }) => {
    expect(printNodes(nodes)).toBe(expected)
  })
})

describe('printJSDoc', () => {
  it.each([
    { when: 'comments is empty', comments: [], expected: '' },
    { when: 'comments holds only undefined', comments: [undefined], expected: '' },
    { when: 'there are several comments', comments: ['@description A pet', '@deprecated'], expected: '/**\n * @description A pet\n * @deprecated\n */' },
    { when: 'a comment spans lines', comments: ['line one\nline two'], expected: '/**\n * line one\n * line two\n */' },
    { when: 'a comment contains */', comments: ['see */ here'], expected: '/**\n * see * / here\n */' },
  ])('returns $expected when $when', ({ comments, expected }) => {
    expect(printJSDoc({ comments })).toBe(expected)
  })
})

describe('printCodeNode', () => {
  it.each([
    { kind: 'Const', node: ast.factory.createConst({ name: 'x', nodes: [ast.factory.createText('1')] }), expected: 'const x = 1' },
    { kind: 'Type', node: ast.factory.createType({ name: 'Pet', nodes: [ast.factory.createText('{ id: number }')] }), expected: 'type Pet = { id: number }' },
    { kind: 'Function', node: ast.factory.createFunction({ name: 'foo' }), expected: 'function foo() {}' },
    { kind: 'ArrowFunction', node: ast.factory.createArrowFunction({ name: 'bar' }), expected: 'const bar = () => {}' },
    { kind: 'Text', node: ast.factory.createText('    const x = 1'), expected: 'const x = 1' },
  ])('returns $expected when given a minimal $kind node', ({ node, expected }) => {
    expect(printCodeNode(node)).toBe(expected)
  })
})

describe('printConst', () => {
  it('returns an as const declaration when asConst is set', () => {
    const node = ast.factory.createConst({
      name: 'pets',
      export: true,
      type: 'Pet[]',
      asConst: true,
      nodes: [ast.factory.createText('[]')],
    })
    expect(printConst(node)).toBe('export const pets: Pet[] = [] as const')
  })

  it('returns the JSDoc block above the declaration when JSDoc is set', () => {
    const node = ast.factory.createConst({
      name: 'pet',
      JSDoc: { comments: ['@description A pet'] },
      nodes: [ast.factory.createText('{}')],
    })
    expect(printConst(node)).toBe('/**\n * @description A pet\n */\nconst pet = {}')
  })

  it('returns a baselined value when the multi-line value has baked-in indentation', () => {
    const node = ast.factory.createConst({
      name: 'pet',
      export: true,
      nodes: [ast.factory.createText('\n    {\n      foo: 1,\n      bar: 2,\n    }\n  ')],
    })
    expect(printConst(node)).toBe(['export const pet = {', '  foo: 1,', '  bar: 2,', '}'].join('\n'))
  })
})

describe('printType', () => {
  it('returns an exported type alias when export is set', () => {
    const node = ast.factory.createType({
      name: 'Pet',
      export: true,
      nodes: [ast.factory.createText('{ id: number }')],
    })
    expect(printType(node)).toBe('export type Pet = { id: number }')
  })
})

describe('printFunction', () => {
  it.each([
    { when: 'a return type is set', node: { returnType: 'Pet' }, expected: 'function getPet(): Pet {}' },
    { when: 'generics is an array', node: { generics: ['T'], params: 'value: T', returnType: 'T' }, expected: 'function getPet<T>(value: T): T {}' },
    {
      when: 'generics is a string',
      node: { generics: 'T extends string', params: 'value: T', returnType: 'T' },
      expected: 'function getPet<T extends string>(value: T): T {}',
    },
  ])('returns $expected when $when', ({ node, expected }) => {
    expect(printFunction(ast.factory.createFunction({ name: 'getPet', ...node }))).toBe(expected)
  })

  it('returns a Promise return type when async is set', () => {
    const node = ast.factory.createFunction({
      name: 'fetchPet',
      export: true,
      async: true,
      returnType: 'Pet',
    })
    expect(printFunction(node)).toBe('export async function fetchPet(): Promise<Pet> {}')
  })

  it('returns a default export when default and export are set', () => {
    const node = ast.factory.createFunction({
      name: 'handler',
      default: true,
      export: true,
    })
    expect(printFunction(node)).toBe('export default function handler() {}')
  })

  it('returns a single-level body when the body has baked-in indentation and blank lines', () => {
    const node = ast.factory.createFunction({
      name: 'getPet',
      nodes: [ast.factory.createText('      const a = 1\n\n      const b = 2')],
    })
    expect(printFunction(node)).toBe(['function getPet() {', '  const a = 1', '', '  const b = 2', '}'].join('\n'))
  })

  it('returns cumulative indentation when a function is nested', () => {
    const inner = ast.factory.createFunction({ name: 'inner', nodes: [ast.factory.createText('return 1')] })
    const node = ast.factory.createFunction({ name: 'outer', nodes: [inner] })
    expect(printFunction(node)).toBe(['function outer() {', '  function inner() {', '    return 1', '  }', '}'].join('\n'))
  })
})

describe('printArrowFunction', () => {
  it.each([
    {
      when: 'the function is single-line',
      node: { singleLine: true, nodes: [ast.factory.createText('value')] },
      expected: 'const identity = <T>(value: T): T => value',
    },
    { when: 'the function is async', node: { async: true }, expected: 'const identity = async <T>(value: T): Promise<T> => {}' },
  ])('returns $expected when generics are set and $when', ({ node, expected }) => {
    expect(printArrowFunction(ast.factory.createArrowFunction({ name: 'identity', generics: ['T'], params: 'value: T', returnType: 'T', ...node }))).toBe(
      expected,
    )
  })

  it('returns an expression body when singleLine is set', () => {
    const node = ast.factory.createArrowFunction({
      name: 'double',
      params: 'n: number',
      singleLine: true,
      nodes: [ast.factory.createText('n * 2')],
    })
    expect(printArrowFunction(node)).toBe('const double = (n: number) => n * 2')
  })

  it('returns an indented block body when nodes are set', () => {
    const node = ast.factory.createArrowFunction({
      name: 'getPet',
      nodes: [ast.factory.createText('return fetch("/pets")')],
    })
    expect(printArrowFunction(node)).toBe(['const getPet = () => {', '  return fetch("/pets")', '}'].join('\n'))
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

  it('returns a single blank line when an explicit break separates declarations', () => {
    const node = ast.factory.createSource({
      nodes: [
        ast.factory.createConst({ name: 'x', nodes: [ast.factory.createText('1')] }),
        ast.factory.createBreak(),
        ast.factory.createConst({ name: 'y', nodes: [ast.factory.createText('2')] }),
      ],
    })
    expect(printSource(node)).toBe('const x = 1\n\nconst y = 2')
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
