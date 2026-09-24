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

  describe('parseCopy', () => {
    const template = [
      "import axios from 'axios'",
      "import { applyHeaderStyles } from './serializers.ts'",
      "import type { HeadersInit } from './serializers.ts'",
      "import { ParseError, type StandardSchemaValidator } from './standardSchema.ts'",
      '',
      'export const client = axios.create()',
    ].join('\n')
    const file = ast.factory.createFile({ baseName: 'client.ts', path: '/src/.kubb/client.ts', copy: '/templates/axios.ts' })

    it('drops the template extension by default', () => {
      expect(parserTs().parseCopy?.(file, template)).toBe(
        [
          "import axios from 'axios'",
          "import { applyHeaderStyles } from './serializers'",
          "import type { HeadersInit } from './serializers'",
          "import { ParseError, type StandardSchemaValidator } from './standardSchema'",
          '',
          'export const client = axios.create()',
        ].join('\n'),
      )
    })

    it('keeps the template extension when explicitly mapped', () => {
      expect(parserTs({ extension: { '.ts': '.ts' } }).parseCopy?.(file, template)).toBe(template)
    })

    it('rewrites the template extension to the mapped value', () => {
      const result = parserTs({ extension: { '.ts': '.js' } }).parseCopy?.(file, template)

      expect(result).toContain("from './serializers.js'")
      expect(result).toContain("from './standardSchema.js'")
      expect(result).toContain("import axios from 'axios'")
    })

    it('uses the mapping of the copied file extension in parserTsx', () => {
      const tsxFile = ast.factory.createFile({ baseName: 'Provider.tsx', path: '/src/.kubb/Provider.tsx', copy: '/templates/Provider.tsx' })
      const result = parserTsx({ extension: { '.tsx': '.js' } }).parseCopy?.(tsxFile, "import { client } from './client.ts'")

      expect(result).toBe("import { client } from './client.js'")
    })
  })
})
