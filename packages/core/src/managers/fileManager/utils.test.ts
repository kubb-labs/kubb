import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { format } from '../../../mocks/format.ts'
import { combineFiles, getFileSource, writeIndexes } from './utils.ts'

import type { File } from './types.ts'

const __filename = fileURLToPath(import.meta.url)

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
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file1.ts',
        source: 'export const test = 2;',
      },
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        source: 'export const test2 = 3;',
      },
    ])

    expect(combined).toEqual([
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        imports: [],
        exports: [],
        source: `export const test = 2;
export const test2 = 3;`,
      },
    ])
  })

  test('if getFileSource is returning code with exports and exports as', () => {
    const fileImport: File = {
      path: path.resolve('./src/models/file1.ts'),
      fileName: 'file1.ts',
      source: 'export const test = 2;',
      imports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
        {
          name: ['Lily'],
          path: './Pets',
          isTypeOnly: true,
        },
        {
          name: 'Dog',
          path: './Dog',
          isTypeOnly: true,
        },
      ],
    }

    const fileExport: File = {
      path: path.resolve('./src/models/file1.ts'),
      fileName: 'file1.ts',
      source: '',
      exports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
        {
          name: ['Lily'],
          path: './Pets',
          isTypeOnly: true,
        },
        {
          name: 'Dog',
          asAlias: true,
          path: './Dog',
          isTypeOnly: true,
        },
      ],
    }

    expect(getFileSource(fileImport)).toEqual('import type { Pets, Lily } from "./Pets";\nimport type Dog from "./Dog";\n\nexport const test = 2;')

    expect(getFileSource(fileExport)).toEqual('export type { Pets, Lily } from "./Pets";\nexport type * as Dog from "./Dog";\n\n')
  })

  test('if combineFiles is combining `exports`, `imports` and `source` for the same file', () => {
    const importFiles: Array<File | null> = [
      null,
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file1.ts',
        source: 'export const test = 2;',
        imports: [
          {
            name: 'Pets',
            path: './Pets',
            isTypeOnly: true,
          },
        ],
      },
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        source: 'export const test2 = 3;',
        imports: [
          {
            name: 'Cats',
            path: './Cats',
            isTypeOnly: true,
          },
        ],
      },
    ]

    const exportFiles: Array<File | null> = [
      null,
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file1.ts',
        source: 'export const test = 2;',
        exports: [
          {
            name: 'Pets',
            path: './Pets',
            isTypeOnly: true,
          },
        ],
      },
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        source: 'export const test2 = 3;',
        exports: [
          {
            name: 'Cats',
            path: './Cats',
            isTypeOnly: true,
          },
        ],
      },
    ]

    expect(combineFiles(importFiles)).toEqual([
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        source: 'export const test = 2;\nexport const test2 = 3;',
        imports: [
          {
            name: 'Pets',
            path: './Pets',
            isTypeOnly: true,
          },
          {
            name: 'Cats',
            path: './Cats',
            isTypeOnly: true,
          },
        ],
        exports: [],
      },
    ])

    expect(combineFiles(exportFiles)).toEqual([
      {
        path: path.resolve('./src/models/file1.ts'),
        fileName: 'file2.ts',
        source: 'export const test = 2;\nexport const test2 = 3;',
        imports: [],
        exports: [
          {
            name: 'Pets',
            path: './Pets',
            isTypeOnly: true,
          },
          {
            name: 'Cats',
            path: './Cats',
            isTypeOnly: true,
          },
        ],
      },
    ])
  })

  test(`if writeIndexes returns 'index.ts' files`, () => {
    const rootPath = path.resolve(__dirname, '../../../mocks/treeNode')
    const files = writeIndexes(rootPath)

    expect(files?.every((file) => file.fileName === 'index.ts')).toBeTruthy()
  })
})
