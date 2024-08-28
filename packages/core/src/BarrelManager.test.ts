import type * as KubbFile from '@kubb/fs/types'

import { format } from '../mocks/format.ts'
import { BarrelManager } from './BarrelManager.ts'
import { getSource } from './FileManager.ts'

describe('BarrelManager', () => {
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

  test(`if getIndexes returns 'index.ts' files`, () => {
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles(files, 'src') || []
    const rootIndex = barrelFiles[0]

    expect(rootIndex).toBeDefined()

    expect(barrelFiles?.every((file) => file.baseName === 'index.ts')).toBeTruthy()

    expect(rootIndex?.exports?.every((file) => !file.path?.endsWith('.ts'))).toBeTruthy()
  })

  test.todo('if getIndexes can return an export with `exportAs` and/or `isTypeOnly`', async () => {
    const barrelManager = new BarrelManager()
    const barrelFiles = barrelManager.getFiles(files, 'src') || []

    const rootIndex = barrelFiles[0]!

    expect(rootIndex).toBeDefined()

    const code = await getSource(rootIndex)

    expect(await format(code)).toMatchSnapshot()

    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })
  test('if getIndexes can return an export with treeNode options', () => {
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
              "path": "./test",
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
              "path": "./hello",
            },
            {
              "isTypeOnly": undefined,
              "name": [
                "world",
              ],
              "path": "./world",
            },
          ],
          "path": "src/sub/index.ts",
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
          ],
        },
      ]
    `)
  })
})
