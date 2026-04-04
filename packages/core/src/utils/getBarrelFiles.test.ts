import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FileManager } from '@kubb/react-fabric'
import { describe, expect, it, test } from 'vitest'
import type * as KubbFile from '../KubbFile.ts'
import { getBarrelFiles } from './getBarrelFiles.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('getBarrelFiles', () => {
  it('should generate barrel files correctly', async () => {
    const fileManager = new FileManager()
    const files: KubbFile.File[] = [
      {
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          {
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        path: 'src/sub/index.ts',
        baseName: 'index.ts',
        sources: [
          {
            name: 'hello',
            value: '',
          },
          {
            name: 'world',
            value: '',
          },
        ],
        imports: [],
        exports: [
          {
            name: ['hello'],
            path: './sub/hello.ts',
          },
          {
            name: ['world'],
            path: './sub/world.ts',
          },
        ],
      },
      {
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          {
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
    ]

    await fileManager.upsert(...files)

    const barrelFiles = await getBarrelFiles(fileManager.files, {
      type: 'all',
      root: 'src',
      output: {
        path: '.',
      },
    })

    await fileManager.upsert(...barrelFiles)

    const processedFiles = fileManager.files

    await expect(JSON.stringify(processedFiles, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/barrel.json'))
  })

  it(`should return 'index.ts' barrel files`, async () => {
    const files: KubbFile.ResolvedFile[] = [
      {
        id: 'src/test.ts',
        name: 'test',
        extname: '.ts',
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          {
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        id: 'src/sub/hello.ts',
        name: 'hello',
        extname: '.ts',
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          {
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        id: 'src/sub/world.ts',
        name: 'world',
        extname: '.ts',
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
    ]

    const barrelFiles = await getBarrelFiles(files, { type: 'named', root: 'src', output: { path: '.' } })
    const rootIndex = barrelFiles[0]

    expect(rootIndex).toBeDefined()
    expect(barrelFiles?.every((file) => file.baseName === 'index.ts')).toBeTruthy()
    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })

  test('should generate barrel files for subdirectories that contain existing index files', async () => {
    const files: KubbFile.ResolvedFile[] = [
      {
        id: 'src/test.ts',
        name: 'test',
        extname: '.ts',
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          {
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        id: 'src/sub/hello.ts',
        name: 'hello',
        extname: '.ts',
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          {
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        id: 'src/sub/world.ts',
        name: 'world',
        extname: '.ts',
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        id: 'src/sub/index.ts',
        name: 'index',
        extname: '.ts',
        path: 'src/sub/index.ts',
        baseName: 'index.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          },
          {
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
    ]

    const barrelFiles = await getBarrelFiles(files, { type: 'named', root: 'src', output: { path: '.' } })

    expect(barrelFiles).toMatchInlineSnapshot(`
      [
        {
          "baseName": "index.ts",
          "exports": [
            {
              "isTypeOnly": undefined,
              "name": [
                "test",
              ],
              "path": "./test.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "hello",
              ],
              "path": "./sub/hello.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "world",
              ],
              "path": "./sub/world.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "world",
              ],
              "path": "./sub/index.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "hello",
              ],
              "path": "./sub/index.ts",
            },
          ],
          "imports": [],
          "meta": {},
          "path": "src/index.ts",
          "sources": [
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "test",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "hello",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "world",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "world",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "hello",
              "value": "",
            },
          ],
        },
        {
          "baseName": "index.ts",
          "exports": [
            {
              "isTypeOnly": undefined,
              "name": [
                "hello",
              ],
              "path": "./hello.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "world",
              ],
              "path": "./world.ts",
            },
          ],
          "imports": [],
          "meta": {},
          "path": "src/sub/index.ts",
          "sources": [
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "hello",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "world",
              "value": "",
            },
          ],
        },
      ]
    `)
  })
})
