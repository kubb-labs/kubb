import type * as KubbFile from '@kubb/fs/types'

import { BarrelManager } from './BarrelManager.ts'

describe('BarrelManager', () => {
  test(`if getFiles returns 'index.ts' files`, () => {
    const files: KubbFile.File[] = [
      {
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          {
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
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
          },
        ],
      },
      {
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
          },
        ],
      },
    ]
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles(files, 'src') || []
    const rootIndex = barrelFiles[0]

    expect(rootIndex).toBeDefined()
    expect(barrelFiles?.every((file) => file.baseName === 'index.ts')).toBeTruthy()
    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })

  test('if getFiles retuns subdirectory files without already generated index files', () => {
    const files: KubbFile.File[] = [
      {
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          {
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
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
          },
        ],
      },
      {
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
          },
        ],
      },
      {
        path: 'src/sub/index.ts',
        baseName: 'index.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
          },
          {
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
          },
        ],
      },
    ]
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles(files) || []

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
          ],
          "path": "src/index.ts",
          "sources": [
            {
              "isTypeOnly": undefined,
              "name": "test",
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
                "hello",
              ],
              "path": "./sub/index.ts",
            },
          ],
          "path": "src/index.ts",
          "sources": [
            {
              "isTypeOnly": undefined,
              "name": "hello",
              "value": "",
            },
            {
              "isTypeOnly": undefined,
              "name": "world",
              "value": "",
            },
            {
              "isTypeOnly": undefined,
              "name": "world",
              "value": "",
            },
            {
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
          ],
          "path": "src/sub/index.ts",
          "sources": [
            {
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
                "world",
              ],
              "path": "./world.ts",
            },
          ],
          "path": "src/sub/index.ts",
          "sources": [
            {
              "isTypeOnly": undefined,
              "name": "world",
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
                "world",
                "hello",
              ],
              "path": "./index.ts",
            },
          ],
          "path": "src/sub/index.ts",
          "sources": [
            {
              "isTypeOnly": undefined,
              "name": "world",
              "value": "",
            },
            {
              "isTypeOnly": undefined,
              "name": "hello",
              "value": "",
            },
          ],
        },
      ]
    `)
  })
})
