import pathParser from 'node:path'

import { format } from '../../../mocks/format.ts'
import { combineFiles, getFileSource } from './utils.ts'

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', () => {
    const code = getFileSource({
      fileName: 'test.ts',
      path: 'models/ts/test.ts',
      source: 'export type Pet = Pets;',
      imports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
      ],
    })
    expect(format(code)).toMatchInlineSnapshot(`
    "import type { Pets } from './Pets'

    export type Pet = Pets
    "
   `)
  })

  test('if getFileSource is returning code with imports and default import', () => {
    const code = getFileSource({
      fileName: 'test.ts',
      path: 'models/ts/test.ts',
      source: 'export type Pet = Pets;',
      imports: [
        {
          name: 'Pets',
          path: './Pets',
          isTypeOnly: true,
        },
      ],
    })
    expect(format(code)).toMatchInlineSnapshot(`
    "import type Pets from './Pets'

    export type Pet = Pets
    "
   `)
  })
  test('if combineFiles is removing previouscode', async () => {
    const combined = combineFiles([
      {
        path: pathParser.resolve('./src/models/file1.ts'),
        fileName: 'file1.ts',
        source: 'export const test = 2;',
      },
      {
        path: pathParser.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        source: 'export const test2 = 3;',
      },
    ])

    expect(combined).toEqual([
      {
        path: pathParser.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        imports: [],
        exports: [],
        source: `export const test = 2;
export const test2 = 3;`,
      },
    ])
  })

  test.todo('if getFileSource is returning code with exports and exports as')

  test.todo('if combineFiles is combining `exports`, `imports` and `source`')
})
