import type { KubbFile } from '@kubb/fabric-core/types'
import { describe, expect, it, test } from 'vitest'
import { BarrelManager } from './BarrelManager.ts'

describe('BarrelManager', () => {
  it(`if getFiles returns 'index.ts' files`, () => {
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
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles({ files, root: 'src' }) || []
    const rootIndex = barrelFiles[0]

    expect(rootIndex).toBeDefined()
    expect(barrelFiles?.every((file) => file.baseName === 'index.ts')).toBeTruthy()
    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })

  test('if getFiles returns subdirectory files without already generated index files', () => {
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
      {
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
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles({ files }) || []

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
                "world2",
              ],
              "path": "./sub/index.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "hello2",
              ],
              "path": "./sub/index.ts",
            },
          ],
          "imports": [],
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
              "name": "world2",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "hello2",
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
            {
              "isTypeOnly": undefined,
              "name": [
                "world2",
              ],
              "path": "./index.ts",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "hello2",
              ],
              "path": "./index.ts",
            },
          ],
          "imports": [],
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
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "world2",
              "value": "",
            },
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": undefined,
              "name": "hello2",
              "value": "",
            },
          ],
        },
      ]
    `)
  })

  test('generates unique names with numeric suffixes for duplicate identifiers', () => {
    const files: KubbFile.File[] = [
      {
        path: 'src/models/user-type.ts',
        baseName: 'user-type.ts',
        sources: [
          {
            name: 'User',
            value: 'export type User = { id: string };',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        path: 'src/models/user-schema.ts',
        baseName: 'user-schema.ts',
        sources: [
          {
            name: 'User',
            value: 'export const User = z.object({ id: z.string() });',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
      {
        path: 'src/models/user-mock.ts',
        baseName: 'user-mock.ts',
        sources: [
          {
            name: 'User',
            value: 'export const User = () => ({ id: faker.string.uuid() });',
            isExportable: true,
            isIndexable: true,
          },
        ],
        imports: [],
        exports: [],
      },
    ]
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles({ files, root: 'src/models' }) || []

    // Verify that we have one barrel file
    expect(barrelFiles).toHaveLength(1)

    const rootIndex = barrelFiles[0]
    expect(rootIndex).toBeDefined()
    
    // All three User exports should be preserved with unique names
    expect(rootIndex?.sources).toHaveLength(3)
    expect(rootIndex?.exports).toHaveLength(3)

    // First occurrence keeps original name, subsequent get numeric suffixes
    expect(rootIndex?.exports?.[0]?.name).toEqual(['User'])
    expect(rootIndex?.exports?.[0]?.path).toBe('./user-type.ts')
    
    expect(rootIndex?.exports?.[1]?.name).toEqual(['User2'])
    expect(rootIndex?.exports?.[1]?.path).toBe('./user-schema.ts')
    
    expect(rootIndex?.exports?.[2]?.name).toEqual(['User3'])
    expect(rootIndex?.exports?.[2]?.path).toBe('./user-mock.ts')
  })
})
