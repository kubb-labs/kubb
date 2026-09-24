import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { parserTs } from './parserTs.ts'
import { parserTsx } from './parserTsx.ts'

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
    const body = [
      '/** Shared client. */',
      'export const client = axios.create()',
      'export type Options = { headers: HeadersInit; validator: StandardSchemaValidator }',
      'export const helpers = { applyHeaderStyles, ParseError }',
    ].join('\n')
    const template = [
      "import axios from 'axios'",
      "import { applyHeaderStyles } from './serializers.ts'",
      "import type { HeadersInit } from './serializers.ts'",
      "import { ParseError, type StandardSchemaValidator } from './standardSchema.ts'",
      "export * from '../models/pet.ts'",
      '',
      body,
    ].join('\n')
    const file = ast.factory.createFile({ baseName: 'client.ts', path: '/src/.kubb/client.ts', copy: '/templates/axios.ts', footer: 'client.setConfig({})' })

    function copyAndParse(parser: ReturnType<typeof parserTs>, source = template) {
      return parser.parse(ast.factory.createFile(parser.copy!(file, source)))
    }

    it('prints the template imports and exports like an injected file, dropping the extension by default', () => {
      expect(copyAndParse(parserTs())).toBe(
        [
          [
            "import axios from 'axios'",
            "import type { HeadersInit } from './serializers'",
            "import type { StandardSchemaValidator } from './standardSchema'",
            "import { applyHeaderStyles } from './serializers'",
            "import { ParseError } from './standardSchema'",
            "export * from '../models/pet'",
          ].join('\n'),
          body,
          'client.setConfig({})',
        ].join('\n\n'),
      )
    })

    it('keeps the template extension when explicitly mapped', () => {
      const result = copyAndParse(parserTs({ extension: { '.ts': '.ts' } }))

      expect(result).toContain("import { applyHeaderStyles } from './serializers.ts'")
      expect(result).toContain("import type { StandardSchemaValidator } from './standardSchema.ts'")
      expect(result).toContain("export * from '../models/pet.ts'")
    })

    it('rewrites the template extension to the mapped value', () => {
      const result = copyAndParse(parserTs({ extension: { '.ts': '.js' } }))

      expect(result).toContain("import { applyHeaderStyles } from './serializers.js'")
      expect(result).toContain("export * from '../models/pet.js'")
      expect(result).toContain("import axios from 'axios'")
    })

    it('drops template imports the body never uses, like createFile does for injected files', () => {
      const result = copyAndParse(parserTs(), ["import { used, unused } from './a.ts'", 'used()'].join('\n'))

      expect(result).toContain("import { used } from './a'")
    })

    it('lifts namespace and aliased imports, and leaves side-effect imports and other statements in the body', () => {
      const source = ["import * as z from 'zod'", "import { a as b } from './a.ts'", "import './polyfill.ts'", 'b(z)'].join('\n')

      expect(copyAndParse(parserTs({ extension: { '.ts': '.js' } }), source)).toBe(
        ["import * as z from 'zod'\nimport { a as b } from './a.js'", "import './polyfill.ts'\nb(z)", 'client.setConfig({})'].join('\n\n'),
      )
    })

    it('uses the mapping of the copied file extension in parserTsx', () => {
      const tsxFile = ast.factory.createFile({ baseName: 'Provider.tsx', path: '/src/.kubb/Provider.tsx', copy: '/templates/Provider.tsx' })
      const parser = parserTsx({ extension: { '.tsx': '.js' } })

      expect(parser.parse(ast.factory.createFile(parser.copy!(tsxFile, "import { client } from './client.ts'")))).toBe("import { client } from './client.js'")
    })
  })
})
