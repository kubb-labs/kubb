import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createExport, createFile, createSource } from '@kubb/ast'
import type { FileNode } from '@kubb/ast/types'
import { FileManager } from '@kubb/react-fabric'
import { describe, expect, it, test } from 'vitest'
import { getBarrelFiles } from './getBarrelFiles.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('getBarrelFiles', () => {
  it('should generate barrel files correctly', async () => {
    const fileManager = new FileManager()
    const files: FileNode[] = [
      createFile({
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          createSource({
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/index.ts',
        baseName: 'index.ts',
        sources: [
          createSource({
            name: 'hello',
            value: '',
          }),
          createSource({
            name: 'world',
            value: '',
          }),
        ],
        imports: [],
        exports: [
          createExport({
            name: ['hello'],
            path: './sub/hello.ts',
          }),
          createExport({
            name: ['world'],
            path: './sub/world.ts',
          }),
        ],
      }),
      createFile({
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          createSource({
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          createSource({
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
    ]

    await (fileManager as any).upsert(...files)

    const barrelFiles = await getBarrelFiles(fileManager.files as unknown as FileNode[], {
      type: 'all',
      root: 'src',
      output: {
        path: '.',
      },
    })

    await (fileManager as any).upsert(...barrelFiles)

    const processedFiles = fileManager.files

    await expect(JSON.stringify(processedFiles, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/barrel.json'))
  })

  it(`should return 'index.ts' barrel files`, async () => {
    const files: FileNode[] = [
      createFile({
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          createSource({
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          createSource({
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          createSource({
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
    ]

    const barrelFiles = await getBarrelFiles(files, { type: 'named', root: 'src', output: { path: '.' } })
    const rootIndex = barrelFiles[0]

    expect(rootIndex).toBeDefined()
    expect(barrelFiles?.every((file) => file.baseName === 'index.ts')).toBeTruthy()
    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })

  test('should generate barrel files for subdirectories that contain existing index files', async () => {
    const files: FileNode[] = [
      createFile({
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          createSource({
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          createSource({
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          createSource({
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
      createFile({
        path: 'src/sub/index.ts',
        baseName: 'index.ts',
        sources: [
          createSource({
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          }),
          createSource({
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          }),
        ],
      }),
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
