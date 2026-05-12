import { createConst, createFile, createSource, createText, createType } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { parserTs } from './parserTs.ts'

describe('parserTs', () => {
  it('parses a source with structured nodes', async () => {
    const file = createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        createSource({
          nodes: [
            createConst({
              name: 'schema',
              export: true,
              nodes: [createText('z.string()')],
            }),
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
            createType({
              name: 'Pet',
              export: true,
              nodes: [createText('{ id: number }')],
            }),
            createConst({
              name: 'pet',
              export: true,
              nodes: [createText('{}')],
            }),
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
