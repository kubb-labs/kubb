import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { parserTs } from './parserTs.ts'
import { parserTsx } from './parserTsx.ts'

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
      imports: [ast.factory.createImport({ name: ['z'], path: 'zod' })],
      exports: [ast.factory.createExport({ name: 'models', path: './models.ts', asAlias: true })],
    })

    expect(await parserTs().parse(file)).toBe(
      ['// generated', '', "import { z } from 'zod'", "export * as models from './models'", '', 'export const schema = z.string()', '', '// end'].join('\n'),
    )
  })

  it.each([
    { path: 'my-codec/zod', options: {} },
    { path: '@modelcontextprotocol/sdk/server/mcp.js', options: { extension: { '.ts': '.ts' } } },
  ] as const)('keeps the package specifier $path as-is when extension is $options.extension', async ({ path, options }) => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/src/nested/test.ts',
      sources: [ast.factory.createSource({ name: 'schema', isExportable: true, nodes: [ast.factory.createText('export const schema = myCodec.uint64()')] })],
      imports: [ast.factory.createImport({ name: ['myCodec'], path })],
      exports: [],
    })

    expect(await parserTs(options).parse(file)).toContain(`import { myCodec } from '${path}'`)
  })

  it.each([
    { extension: undefined, expected: "import { Pet } from './models/pet'" },
    { extension: '.js', expected: "import { Pet } from './models/pet.js'" },
    { extension: '.ts', expected: "import { Pet } from './models/pet.ts'" },
  ] as const)('returns $expected when the .ts extension maps to $extension', async ({ extension, expected }) => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/src/test.ts',
      sources: [],
      imports: [ast.factory.createImport({ name: ['Pet'], path: '/src/models/pet.ts', root: '/src/test.ts' })],
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

    it.each([
      ['.ts', "from '../options.ts'"],
      ['.js', "from '../options.js'"],
    ] as const)('applies the %s extension to template imports', (extension, expected) => {
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

    it.each(['#!/usr/bin/env node', "'use client'"])('keeps %s above the lifted imports', (header) => {
      const source = [header, "import { api } from './api.ts'", 'api()'].join('\n')

      expect(copy(parserTs(), source)).toBe([header, "import { api } from './api'", 'api()'].join('\n\n'))
    })
  })
})

describe('parserTsx', () => {
  it('returns the same output as parserTs when parsing a tsx file', async () => {
    const file = ast.factory.createFile({
      baseName: 'Pet.tsx',
      path: '/src/Pet.tsx',
      sources: [
        ast.factory.createSource({
          nodes: [ast.factory.createConst({ name: 'Pet', export: true, nodes: [ast.factory.createText('(props: Props) => <div />')] })],
        }),
      ],
      imports: [ast.factory.createImport({ name: ['Props'], path: '/src/types.ts', root: '/src/Pet.tsx', isTypeOnly: true })],
      exports: [],
    })

    expect(await parserTsx().parse(file)).toBe(["import type { Props } from './types'", '', 'export const Pet = (props: Props) => <div />'].join('\n'))
  })

  it('returns .tsx and .jsx as the handled extensions', () => {
    expect(parserTsx().extNames).toStrictEqual(['.tsx', '.jsx'])
  })
})
