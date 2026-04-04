import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFile, createSource } from '@kubb/ast'
import type { FileNode } from '@kubb/ast/types'
import { FileManager } from '@kubb/react-fabric'
import { describe, expect, it, test } from 'vitest'
import type * as KubbFile from '../KubbFile.ts'
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
        imports: [],
        exports: [],
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
          {
            kind: 'Export',
            name: ['hello'],
            path: './sub/hello.ts',
          },
          {
            kind: 'Export',
            name: ['world'],
            path: './sub/world.ts',
          },
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
        imports: [],
        exports: [],
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
        imports: [],
        exports: [],
      }),
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
              "kind": "Export",
              "name": [
                "test",
              ],
              "path": "./test.ts",
            },
            {
              "isTypeOnly": undefined,
              "kind": "Export",
              "name": [
                "hello",
              ],
              "path": "./sub/hello.ts",
            },
            {
              "isTypeOnly": undefined,
              "kind": "Export",
              "name": [
                "world",
              ],
              "path": "./sub/world.ts",
            },
            {
              "isTypeOnly": undefined,
              "kind": "Export",
              "name": [
                "world",
              ],
              "path": "./sub/index.ts",
            },
            {
              "isTypeOnly": undefined,
              "kind": "Export",
              "name": [
                "hello",
              ],
              "path": "./sub/index.ts",
            },
          ],
          "extname": ".ts",
          "id": "a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80",
          "imports": [],
          "kind": "File",
          "meta": {},
          "name": "index",
          "path": "src/index.ts",
          "sources": [
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
              "name": "test",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
              "name": "hello",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
              "name": "world",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
              "name": "world",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
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
              "kind": "Export",
              "name": [
                "hello",
              ],
              "path": "./hello.ts",
            },
            {
              "isTypeOnly": undefined,
              "kind": "Export",
              "name": [
                "world",
              ],
              "path": "./world.ts",
            },
          ],
          "extname": ".ts",
          "id": "00d9bb747968e55db50fa82465b2f0678d957e9befeaff84a70e431486a8a132",
          "imports": [],
          "kind": "File",
          "meta": {},
          "name": "index",
          "path": "src/sub/index.ts",
          "sources": [
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
              "name": "hello",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "kind": "Source",
              "name": "world",
              "value": "",
            },
          ],
        },
      ]
    `)
  })
})
