import { ast } from '@kubb/ast'
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
})
