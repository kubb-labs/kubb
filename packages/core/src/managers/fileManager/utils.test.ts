import pathParser from 'path'

import { combineFiles, getFileSource } from './utils'

import { format } from '../../../mocks/format'

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
          asType: true,
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
          asType: true,
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
        path: pathParser.resolve('./src/models/file1.js'),
        fileName: 'file1.js',
        source: 'export const test = 2;',
      },
      {
        path: pathParser.resolve('./src/models/file1.js'),
        fileName: 'file2.js',
        source: 'export const test2 = 3;',
      },
    ])

    expect(combined).toEqual([
      {
        path: pathParser.resolve('./src/models/file1.js'),
        fileName: 'file2.js',
        imports: [],
        source: `export const test = 2;
export const test2 = 3;`,
      },
    ])
  })
})
