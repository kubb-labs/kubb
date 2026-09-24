import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { parserTs } from './parserTs.ts'

describe('parserTs', () => {
  it('parses a source with structured nodes', async () => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        ast.factory.createSource({
          nodes: [
            ast.factory.createConst({
              name: 'schema',
              export: true,
              nodes: [ast.factory.createText('z.string()')],
            }),
          ],
        }),
      ],
      imports: [],
      exports: [],
    })

    const result = await parserTs().parse(file)
    expect(result).toContain('export const schema = z.string()')
  })

  it('parses a source with type and const nodes', async () => {
    const file = ast.factory.createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        ast.factory.createSource({
          nodes: [
            ast.factory.createType({
              name: 'Pet',
              export: true,
              nodes: [ast.factory.createText('{ id: number }')],
            }),
            ast.factory.createConst({
              name: 'pet',
              export: true,
              nodes: [ast.factory.createText('{}')],
            }),
          ],
        }),
      ],
      imports: [],
      exports: [],
    })

    const result = await parserTs().parse(file)
    expect(result).toContain('export type Pet = { id: number }')
    expect(result).toContain('export const pet = {}')
  })

  describe('extension option', () => {
    function createFileWithImport() {
      return ast.factory.createFile({
        baseName: 'test.ts',
        path: '/src/test.ts',
        sources: [],
        imports: [ast.factory.createImport({ name: ['Pet'], path: '/src/models/pet.ts', root: '/src' })],
        exports: [],
      })
    }

    it('drops the source extension by default', async () => {
      const result = await parserTs().parse(createFileWithImport())
      expect(result).toContain("import { Pet } from './models/pet'")
    })

    it('rewrites the import extension to the mapped value', async () => {
      const result = await parserTs({ extension: { '.ts': '.js' } }).parse(createFileWithImport())
      expect(result).toContain("import { Pet } from './models/pet.js'")
    })

    it('keeps the source extension when explicitly mapped', async () => {
      const result = await parserTs({ extension: { '.ts': '.ts' } }).parse(createFileWithImport())
      expect(result).toContain("import { Pet } from './models/pet.ts'")
    })
  })

  describe('copy', () => {
    const file = ast.factory.createFile({ baseName: 'client.ts', path: '/src/client.ts', copy: '/templates/client.ts' })
    const template = [
      "import axios from 'axios'",
      "import { defaults, type Options } from './options.ts'",
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
          "import type { Options } from './options'",
          "import { defaults } from './options'",
          "export * from './models'",
          '',
          'export const client = (options: Options) => axios.create({ ...defaults, ...options })',
        ].join('\n'),
      )
    })

    it.each([
      ['.ts', "from './options.ts'"],
      ['.js', "from './options.js'"],
    ] as const)('applies the %s extension to template imports', (extension, expected) => {
      expect(copy(parserTs({ extension: { '.ts': extension } }))).toContain(expected)
    })

    it('keeps quoted import names', () => {
      expect(copy(parserTs(), ["import { 'a-b' as ab } from './a.ts'", 'ab()'].join('\n'))).toBe(["import { 'a-b' as ab } from './a'", '', 'ab()'].join('\n'))
    })

    it.each([
      ['a side-effect import before other imports', ["import './setup.ts'", "import { client } from './client.ts'", 'client()']],
      ['an import with attributes', ["import data from './data.json' with { type: 'json' }", 'data()']],
      ['a shebang', ['#!/usr/bin/env node', "import { client } from './client.ts'", 'client()']],
    ])('keeps the source as written for %s', (_, lines) => {
      const source = lines.join('\n')

      expect(copy(parserTs(), source)).toBe(source)
    })
  })
})
