import path from 'node:path'

import { format } from '../mocks/format.ts'
import { FileManager, combineExports, combineImports, getSource } from './FileManager.ts'

import type * as KubbFile from '@kubb/fs/types'

describe('FileManager', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')
  const filePath = path.resolve(mocksPath, './hellowWorld.js')
  const folderPath = path.resolve(mocksPath, './folder')

  test('fileManager.add also adds the files to the cache', async () => {
    const fileManager = new FileManager()
    await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    await fileManager.add({
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    expect(FileManager.extensions).toEqual(['.js', '.ts', '.tsx'])
    expect(fileManager.files.length).toBe(2)
  })

  test('fileManager.add will return array of files or one file depending on the input', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1 ='file1';",
      imports: [{ name: 'path', path: 'node:path' }],
    })

    expect(file).toBeDefined()
    expect((file as any).length).toBeUndefined()

    const file2 = await fileManager.add(
      {
        path: path.resolve('./src/file1.ts'),
        baseName: 'file1.ts',
        source: "const file1 ='file1';",
        imports: [{ name: 'path', path: 'node:path' }],
      },
      {
        path: path.resolve('./src/file1.ts'),
        baseName: 'file1.ts',
        source: "const file1 ='file1';",
        imports: [{ name: 'path', path: 'node:path' }],
      },
    )

    expect(file2).toBeDefined()
    expect((file2 as any).length).toBeDefined()
  })

  test('fileManager.addOrAppend also adds the files to the cache', async () => {
    const fileManager = new FileManager()
    await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1 ='file1';",
      imports: [{ name: 'path', path: 'node:path' }],
    })

    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1Bis ='file1Bis';",
      imports: [{ name: 'fs', path: 'node:fs' }],
    })

    expect(file).toBeDefined()

    expect(fileManager.files.length).toBe(1)

    expect(file.source).toBe(`const file1 ='file1';\nconst file1Bis ='file1Bis';`)
    expect(file.imports).toStrictEqual([
      { name: 'path', path: 'node:path' },
      { name: 'fs', path: 'node:fs' },
    ])
  })
  test('if creation of graph is correct', () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })
    fileManager.add({
      path: path.resolve('./src/hooks/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: path.resolve('./src/models/file2.ts'),
      baseName: 'file2.ts',
      source: '',
    })

    expect(fileManager.files.length).toBe(4)
  })

  test('fileManager.getCacheById', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    const resolvedFile = fileManager.getCacheById(file.id)

    if (resolvedFile) {
      expect(resolvedFile).toBeDefined()
      expect(resolvedFile.source).toBe(file.source)
    }
  })

  test('fileManager.remove', async () => {
    const fileManager = new FileManager()
    const filePath = path.resolve('./src/file1.ts')
    await fileManager.add({
      path: filePath,
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.deleteByPath(filePath)

    const expectedRemovedFile = fileManager.files.find((f) => f.path === filePath)

    expect(expectedRemovedFile).toBeUndefined()
  })

  test('if getMode returns correct mode (single or split)', () => {
    expect(FileManager.getMode(filePath)).toBe('single')
    expect(FileManager.getMode(folderPath)).toBe('split')
    expect(FileManager.getMode(undefined)).toBe('split')
    expect(FileManager.getMode(null)).toBe('split')
  })
  test.todo('fileManager.addIndexes')

  test('fileManager.orderedFiles', async () => {
    const fileManager = new FileManager()
    await fileManager.add({
      path: 'src/axios/file2.ts',
      baseName: 'file2.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/controller/test.ts',
      baseName: 'test.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/axios/file1.ts',
      baseName: 'file2.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/test.ts',
      baseName: 'test.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/axios/controller/pet.ts',
      baseName: 'pet.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/axios/index.ts',
      baseName: 'index.ts',
      source: '',
    })

    expect(fileManager.orderedFiles).toMatchInlineSnapshot(`
      [
        {
          "baseName": "test.ts",
          "id": "bc7d8e8a7dbcd273eeefde16f0b49284c0a4fdf6",
          "name": "test",
          "path": "src/test.ts",
          "source": "",
        },
        {
          "baseName": "file2.ts",
          "id": "cd0facba6e2fa54c91f40c32aa4646ed494e4586",
          "name": "file2",
          "path": "src/axios/file2.ts",
          "source": "",
        },
        {
          "baseName": "file2.ts",
          "id": "18493e86c6800d1e05da320dd303b3ab172210e7",
          "name": "file2",
          "path": "src/axios/file1.ts",
          "source": "",
        },
        {
          "baseName": "index.ts",
          "id": "fa692df3f230a8bb80390145ba87895e55d3e4c4",
          "name": "index",
          "path": "src/axios/index.ts",
          "source": "",
        },
        {
          "baseName": "test.ts",
          "id": "e26573e3f3ca98fe1f254bebc2dff6ddd88f4552",
          "name": "test",
          "path": "src/controller/test.ts",
          "source": "",
        },
        {
          "baseName": "pet.ts",
          "id": "924a8be2679c698847cac70eba758ef4928f8bc2",
          "name": "pet",
          "path": "src/axios/controller/pet.ts",
          "source": "",
        },
      ]
    `)
  })

  test('fileManager.groupedFiles', async () => {
    const fileManager = new FileManager()
    await fileManager.add({
      path: 'src/axios/file2.ts',
      baseName: 'file2.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/controller/test.ts',
      baseName: 'test.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/axios/file1.ts',
      baseName: 'file2.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/test.ts',
      baseName: 'test.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/axios/controller/pet.ts',
      baseName: 'pet.ts',
      source: '',
    })

    await fileManager.add({
      path: 'src/axios/index.ts',
      baseName: 'index.ts',
      source: '',
    })

    expect(fileManager.groupedFiles).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "children": [
              {
                "children": [
                  {
                    "name": "file2.ts",
                    "path": "/src/axios/file2.ts",
                    "type": "file",
                  },
                  {
                    "name": "file1.ts",
                    "path": "/src/axios/file1.ts",
                    "type": "file",
                  },
                  {
                    "children": [
                      {
                        "name": "pet.ts",
                        "path": "/src/axios/controller/pet.ts",
                        "type": "file",
                      },
                    ],
                    "name": "controller",
                    "path": "/src/axios/controller",
                    "type": "folder",
                  },
                  {
                    "name": "index.ts",
                    "path": "/src/axios/index.ts",
                    "type": "file",
                  },
                ],
                "name": "axios",
                "path": "/src/axios",
                "type": "folder",
              },
              {
                "children": [
                  {
                    "name": "test.ts",
                    "path": "/src/controller/test.ts",
                    "type": "file",
                  },
                ],
                "name": "controller",
                "path": "/src/controller",
                "type": "folder",
              },
              {
                "name": "test.ts",
                "path": "/src/test.ts",
                "type": "file",
              },
            ],
            "name": "src",
            "path": "/src",
            "type": "folder",
          },
        ],
        "name": ".",
        "path": ".",
        "type": "folder",
      }
    `)
  })
})

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', async () => {
    const code = await getSource({
      baseName: 'test.ts',
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
    const codeWithDefaultImport = await getSource({
      baseName: 'test.ts',
      path: 'models/ts/test.ts',
      source: 'export type Pet = Pets | Cat; const test = [client, React];',
      imports: [
        {
          name: 'client',
          path: './Pets',
        },
        {
          name: ['Pets', 'Cat'],
          path: './Pets',
          isTypeOnly: true,
        },
        {
          name: 'React',
          path: './React',
        },
      ],
    })
    const codeWithDefaultImportOrder = await getSource({
      baseName: 'test.ts',
      path: 'models/ts/test.ts',
      source: 'export type Pet = Pets | Cat;\nconst test = [client, React];',
      imports: [
        {
          name: ['Pets', 'Cat'],
          path: './Pets',
          isTypeOnly: true,
        },
        {
          name: 'client',
          path: './Pets',
        },
        {
          name: 'React',
          path: './React',
        },
        {
          name: ['Pets', 'Cat'],
          path: './Pets',
          isTypeOnly: true,
        },
      ],
    })

    expect(await format(await code)).toMatchSnapshot()
    expect(await format(await codeWithDefaultImport)).toMatchSnapshot()
    expect(await format(await codeWithDefaultImportOrder)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with imports and default import', async () => {
    const code = await getSource({
      baseName: 'test.ts',
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
    expect(await format(code)).toMatchSnapshot()
  })
  test('if combineFiles is removing previous code', () => {
    const combined = FileManager.combineFiles([
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: 'export const test = 2;',
      },
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file2.ts',
        source: 'export const test2 = 3;',
      },
    ])

    expect(combined).toMatchObject([
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file2.ts',
        imports: [],
        exports: [],
        source: `export const test = 2;
export const test2 = 3;`,
      },
    ])
  })
  test('if combineFiles is overriding with latest file', () => {
    const combined = FileManager.combineFiles([
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: 'export const test = 2;',
      },
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: 'export const test2 = 3;',
        override: true,
      },
    ])

    expect(combined).toMatchObject([
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        imports: [],
        exports: [],
        source: 'export const test2 = 3;',
        override: true,
      },
    ])
  })

  test('if getFileSource is returning code with exports and exports as', async () => {
    const fileImport: KubbFile.File = {
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: `export const test = 2;
      type Test = Pets | Lily | Dog;`,
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

    const fileExport: KubbFile.File = {
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
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

    expect(await format(await getSource(fileImport))).toMatchSnapshot()
    expect(await format(await getSource(fileExport))).toMatchSnapshot()
  })

  test('if combineFiles is combining `exports`, `imports` and `source` for the same file', () => {
    const importFiles: Array<KubbFile.File | null> = [
      null,
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: 'export const test = 2;',
        imports: [
          {
            name: 'Pets',
            path: './Pets',
            isTypeOnly: true,
          },
        ],
        env: {
          test: 'test',
        },
      },
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file2.ts',
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

    const exportFiles: Array<KubbFile.File | null> = [
      null,
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
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
        baseName: 'file2.ts',
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

    expect(FileManager.combineFiles(importFiles)).toEqual([
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file2.ts',
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
        env: {
          test: 'test',
        },
      },
    ])

    expect(FileManager.combineFiles(exportFiles)).toMatchObject([
      {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file2.ts',
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

  test('if getFileSource is setting `process.env` based on `env` object', async () => {
    const fileImport: KubbFile.File = {
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: 'export const hello = process.env.HELLO;',
      imports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
      ],
      env: {
        HELLO: `"world"`,
      },
    }

    const fileImportAdvanced: KubbFile.File = {
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: 'export const hello = process.env["HELLO"]; type Test = Pets;',
      imports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
      ],
      env: {
        HELLO: `"world"`,
      },
    }

    const fileImportDeclareModule: KubbFile.File = {
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: `
      declare const TEST: string;

      export const hello = typeof TEST !== 'undefined' ? TEST : undefined
      type Test = Pets;
      `,
      imports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
      ],
      env: {
        TEST: `"world"`,
      },
    }

    expect(await format(await getSource(fileImport))).toMatchSnapshot()
    expect(await format(await getSource(fileImportAdvanced))).toMatchSnapshot()
    expect(await format(await getSource(fileImportDeclareModule))).toMatchSnapshot()
  })

  test('if combineExports is filtering out duplicated exports', () => {
    const exports: Array<KubbFile.Export> = [
      {
        path: './models',
        name: undefined,
        isTypeOnly: true,
      },
      {
        path: './models',
        isTypeOnly: false,
      },
      {
        path: './models',
        isTypeOnly: false,
        asAlias: true,
        name: 'test',
      },
    ]

    expect(combineExports(exports)).toMatchInlineSnapshot(`
      [
        {
          "isTypeOnly": true,
          "name": undefined,
          "path": "./models",
        },
        {
          "asAlias": true,
          "isTypeOnly": false,
          "name": "test",
          "path": "./models",
        },
      ]
    `)
  })

  test('if combineImports is filtering out duplicated imports', () => {
    const imports: Array<KubbFile.Import> = [
      {
        path: './models',
        name: 'models',
        isTypeOnly: true,
      },
      {
        path: './models',
        name: ['Config'],
        isTypeOnly: true,
      },
      {
        path: './models',
        name: 'models',
        isTypeOnly: false,
      },
    ]

    expect(combineImports(imports, [], 'const test = models; type Test = Config;')).toEqual([imports[0], imports[1]])

    const importsWithoutSource: Array<KubbFile.Import> = [
      {
        path: './models',
        name: 'models',
        isTypeOnly: true,
      },
      {
        path: './models',
        name: ['Config'],
        isTypeOnly: true,
      },
      {
        path: './models',
        name: 'models',
        isTypeOnly: false,
      },
    ]

    expect(combineImports(importsWithoutSource, [])).toEqual([imports[0], imports[1]])
  })
})
