import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { parserTs } from './parserTs.ts'

describe('parserTs', () => {
  it('returns the declarations separated by blank lines when a source has several nodes', async () => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        ast.factory.createSource({
          nodes: [
            ast.factory.createType({
              name: 'Pet',
              export: true,
              JSDoc: { comments: ['@description A pet'] },
              nodes: [ast.factory.createText('{ id: number }')],
            }),
            ast.factory.createConst({ name: 'pet', export: true, nodes: [ast.factory.createText('{}')] }),
            ast.factory.createFunction({ name: 'getPet', export: true, JSDoc: { comments: ['@deprecated'] } }),
            ast.factory.createArrowFunction({
              name: 'fetchPet',
              export: true,
              singleLine: true,
              JSDoc: { comments: ['@see getPet'] },
              nodes: [ast.factory.createText('pet')],
            }),
          ],
        }),
      ],
      imports: [],
      exports: [],
    })

    expect(await parserTs().parse(file)).toBe(
      [
        '/**',
        ' * @description A pet',
        ' */',
        'export type Pet = { id: number }',
        '',
        'export const pet = {}',
        '',
        '/**',
        ' * @deprecated',
        ' */',
        'export function getPet() {}',
        '',
        '/**',
        ' * @see getPet',
        ' */',
        'export const fetchPet = () => pet',
      ].join('\n'),
    )
  })

  it('returns the banner, imports, exports, source and footer in order when all are set', async () => {
    const file = ast.factory.createFile({
      baseName: 'index.ts',
      path: '/src/index.ts',
      banner: '// generated',
      footer: '// end',
      sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export const schema = z.string()')] })],
      imports: [ast.factory.createImport({ names: [{ name: 'z' }], path: 'zod' })],
      exports: [ast.factory.createExport({ names: [{ name: '*', alias: 'models' }], path: './models.ts' })],
    })

    expect(await parserTs().parse(file)).toBe(
      ['// generated', '', "import { z } from 'zod'", "export * as models from './models'", '', 'export const schema = z.string()', '', '// end'].join('\n'),
    )
  })

  it('prints imports and exports built from names the same as ones built with the deprecated fields', async () => {
    const make = (imports: Array<ast.ImportNode>, exports: Array<ast.ExportNode>) =>
      parserTs().parse(
        ast.factory.createFile({
          baseName: 'index.ts',
          path: '/src/index.ts',
          sources: [ast.factory.createSource({ nodes: [ast.factory.createText('Pet petSchema z faker useSWR')] })],
          imports,
          exports,
        }),
      )
    const deprecated = await make(
      [
        ast.factory.createImport({ name: ['Pet'], path: '/src/pet.ts', root: '/src/index.ts', isTypeOnly: true }),
        ast.factory.createImport({ name: ['petSchema'], path: '/src/pet.ts', root: '/src/index.ts' }),
        ast.factory.createImport({ name: 'z', path: 'zod', isNameSpace: true }),
        ast.factory.createImport({ name: 'useSWR', path: 'swr' }),
        ast.factory.createImport({ name: [{ propertyName: 'fakerEN', name: 'faker' }], path: '@faker-js/faker' }),
      ],
      [ast.factory.createExport({ path: './models.ts' }), ast.factory.createExport({ name: 'utils', path: './utils.ts', asAlias: true })],
    )
    const names = await make(
      [
        ast.factory.createImport({
          names: [
            { name: 'Pet', space: 'type' },
            { name: 'petSchema', space: 'value' },
          ],
          path: '/src/pet.ts',
          root: '/src/index.ts',
        }),
        ast.factory.createImport({ names: [{ name: '*', alias: 'z', space: 'value' }], path: 'zod' }),
        ast.factory.createImport({ names: [{ name: 'default', alias: 'useSWR', space: 'value' }], path: 'swr' }),
        ast.factory.createImport({ names: [{ name: 'fakerEN', alias: 'faker', space: 'value' }], path: '@faker-js/faker' }),
      ],
      [
        ast.factory.createExport({ names: [{ name: '*', space: 'value' }], path: './models.ts' }),
        ast.factory.createExport({ names: [{ name: '*', alias: 'utils', space: 'value' }], path: './utils.ts' }),
      ],
    )

    expect(names).toBe(deprecated)
  })

  it.each([
    {
      when: 'an import has several names',
      file: { sources: [], imports: [ast.factory.createImport({ names: [{ name: 'a' }, { name: 'b' }], path: '/src/x.ts', root: '/src/test.ts' })] },
      expected: "import { a, b } from './x'",
    },
    { when: 'the source has no nodes', file: { sources: [ast.factory.createSource({})], imports: [] }, expected: '' },
  ])('returns $expected when $when', async ({ file, expected }) => {
    expect(await parserTs().parse(ast.factory.createFile({ baseName: 'test.ts', path: '/src/test.ts', exports: [], ...file }))).toBe(expected)
  })

  it.each([
    { path: 'my-codec/zod', options: {} },
    { path: '@modelcontextprotocol/sdk/server/mcp.js', options: { extension: { '.ts': '.ts' } } },
  ] as const)('keeps the package specifier $path as-is when extension is $options.extension', async ({ path, options }) => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/src/nested/test.ts',
      sources: [ast.factory.createSource({ name: 'schema', export: true, nodes: [ast.factory.createText('export const schema = myCodec.uint64()')] })],
      imports: [ast.factory.createImport({ names: [{ name: 'myCodec' }], path })],
      exports: [],
    })

    expect(await parserTs(options).parse(file)).toContain(`import { myCodec } from '${path}'`)
  })

  it.each([
    { extension: undefined, expected: "import { Pet } from './models/pet'" },
    { extension: '.js', expected: "import { Pet } from './models/pet.js'" },
  ] as const)('returns $expected when the .ts extension maps to $extension', async ({ extension, expected }) => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/src/test.ts',
      sources: [],
      imports: [ast.factory.createImport({ names: [{ name: 'Pet' }], path: '/src/models/pet.ts', root: '/src/test.ts' })],
      exports: [],
    })
    const options = extension ? { extension: { '.ts': extension } } : {}

    expect(await parserTs(options).parse(file)).toBe(expected)
  })

  describe('copy', () => {
    const file = ast.factory.createFile({ baseName: 'client.ts', path: '/src/client.ts', copy: '/templates/client.ts' })
    const template = [
      "import axios from 'axios'",
      "import { defaults, type Options } from '../options.ts'",
      "export * from './models.ts'",
      '',
      'export const client = (options: Options) => axios.create({ ...defaults, ...options })',
    ].join('\n')

    function copy(parser: ReturnType<typeof parserTs>, source = template) {
      return parser.parse(ast.factory.createFile(parser.copy!(file, source)))
    }

    it('prints the template imports and exports as nodes', () => {
      expect(copy(parserTs())).toBe(
        [
          "import axios from 'axios'",
          "import type { Options } from '../options'",
          "import { defaults } from '../options'",
          "export * from './models'",
          '',
          'export const client = (options: Options) => axios.create({ ...defaults, ...options })',
        ].join('\n'),
      )
    })

    it.each([['.ts', "from '../options.ts'"]] as const)('applies the %s extension to template imports', (extension, expected) => {
      expect(copy(parserTs({ extension: { '.ts': extension } }))).toContain(expected)
    })

    it('keeps quoted import names', () => {
      expect(copy(parserTs(), ["import { 'a-b' as ab } from './a.ts'", 'ab()'].join('\n'))).toBe(["import { 'a-b' as ab } from './a'", '', 'ab()'].join('\n'))
    })

    it.each([
      ['a side-effect import before other imports', ["import './setup.ts'", "import { api } from './api.ts'", 'api()']],
      ['an import with attributes', ["import data from './data.json' with { type: 'json' }", 'data()']],
    ])('keeps the source as written for %s', (_, lines) => {
      const source = lines.join('\n')

      expect(copy(parserTs(), source)).toBe(source)
    })

    it.each([
      [
        'comments and semicolons',
        ["import a from 'a'; // a", '/* b */', 'import { b } from "b";', 'a(b)'],
        ["import a from 'a'", "import { b } from 'b'", '', '// a', '/* b */', '', 'a(b)'],
      ],
      [
        'a multi-line named import',
        ['import {', '  a,', '  type B,', "} from './a.ts'", 'a<B>()'],
        ["import type { B } from './a'", "import { a } from './a'", '', 'a<B>()'],
      ],
      ['a namespace import', ["import * as a from './a.ts'", 'a()'], ["import * as a from './a'", '', 'a()']],
      ['a default import named type', ["import type from './a.ts'", 'type()'], ["import type from './a'", '', 'type()']],
      ['an export star with an alias', ["export * as a from './a.ts'", 'b()'], ["export * as a from './a'", '', 'b()']],
      ['an import below other code, as TypeScript hoists it', ['a()', "import { b } from './b.ts'"], ['a()', '', "import { b } from './b'"]],
    ])('lifts %s', (_, lines, expected) => {
      expect(copy(parserTs(), lines.join('\n'))).toBe(expected.join('\n'))
    })

    it.each([
      ['an empty named import, which still runs the module', ["'use client'", "import {} from './setup.ts'", "import { b } from './b.ts'", 'b()']],
      ['an aliased re-export', ["export { a as b } from './a.ts'", 'c()']],
      ['a template literal that looks like an import', ["const a = `import b from 'c'`"]],
    ])('keeps the source as written for %s', (_, lines) => {
      const source = lines.join('\n')

      expect(copy(parserTs(), source)).toBe(source)
    })

    it.each(['#!/usr/bin/env node', "'use client'"])('keeps %s above the lifted imports', (header) => {
      const source = [header, "import { api } from './api.ts'", 'api()'].join('\n')

      expect(copy(parserTs(), source)).toBe([header, "import { api } from './api'", 'api()'].join('\n\n'))
    })
  })
})
