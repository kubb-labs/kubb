import { factory } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { parserTs } from './parserTs.ts'

describe('parserTs', () => {
  it('parses a source with structured nodes', async () => {
    const file = factory.createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        factory.createSource({
          nodes: [
            factory.createConst({
              name: 'schema',
              export: true,
              nodes: [factory.createText('z.string()')],
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
    const file = factory.createFile({
      baseName: 'test.ts',
      path: '/test.ts',
      sources: [
        factory.createSource({
          nodes: [
            factory.createType({
              name: 'Pet',
              export: true,
              nodes: [factory.createText('{ id: number }')],
            }),
            factory.createConst({
              name: 'pet',
              export: true,
              nodes: [factory.createText('{}')],
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
