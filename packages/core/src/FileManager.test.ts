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
      sources: [],
    })

    await fileManager.add({
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      sources: [],
    })

    expect(fileManager.files.length).toBe(2)
  })

  test('fileManager.add will return array of files or one file depending on the input', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      imports: [{ name: 'path', path: 'node:path' }],
      sources: [
        {
          value: "const file1 ='file1';",
        },
      ],
    })

    expect(file).toBeDefined()
    expect((file as any).length).toBeUndefined()

    const file2 = await fileManager.add(
      {
        path: path.resolve('./src/file1.ts'),
        baseName: 'file1.ts',
        imports: [{ name: 'path', path: 'node:path' }],
        sources: [
          {
            value: "const file1 ='file1';",
          },
        ],
      },
      {
        path: path.resolve('./src/file1.ts'),
        baseName: 'file1.ts',
        imports: [{ name: 'path', path: 'node:path' }],
        sources: [
          {
            value: "const file1 ='file1';",
          },
        ],
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
      imports: [{ name: 'path', path: 'node:path' }],
      sources: [
        {
          value: "const file1 ='file1';",
        },
      ],
    })

    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      imports: [{ name: 'fs', path: 'node:fs' }],
      sources: [
        {
          value: "const file1Bis ='file1Bis';",
        },
      ],
    })

    expect(file).toBeDefined()

    expect(fileManager.files.length).toBe(1)

    expect(file.sources).toBe(`const file1 ='file1';\nconst file1Bis ='file1Bis';`)
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
      sources: [],
    })
    fileManager.add({
      path: path.resolve('./src/hooks/file1.ts'),
      baseName: 'file1.ts',
      sources: [],
    })

    fileManager.add({
      path: path.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      sources: [],
    })

    fileManager.add({
      path: path.resolve('./src/models/file2.ts'),
      baseName: 'file2.ts',
      sources: [],
    })

    expect(fileManager.files.length).toBe(4)
  })

  test('fileManager.getCacheById', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      sources: [],
    })

    const resolvedFile = fileManager.getCacheById(file.id)

    if (resolvedFile) {
      expect(resolvedFile).toBeDefined()
      expect(resolvedFile.sources).toBe(file.sources)
    }
  })

  test('fileManager.remove', async () => {
    const fileManager = new FileManager()
    const filePath = path.resolve('./src/file1.ts')
    await fileManager.add({
      path: filePath,
      baseName: 'file1.ts',
      sources: [],
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
      sources: [],
    })

    await fileManager.add({
      path: 'src/controller/test.ts',
      baseName: 'test.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/axios/file1.ts',
      baseName: 'file2.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/test.ts',
      baseName: 'test.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/axios/controller/pet.ts',
      baseName: 'pet.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/axios/index.ts',
      baseName: 'index.ts',
      sources: [],
    })

    expect(fileManager.orderedFiles).toMatchInlineSnapshot(`
      [
        {
          "baseName": "test.ts",
          "extName": "ts",
          "id": "19a844882848cd1bf8e191680a1c70df04b6e0db",
          "name": "test",
          "path": "src/test.ts",
          "source": "",
          "sources": [],
        },
        {
          "baseName": "file2.ts",
          "extName": "ts",
          "id": "4f7babf4969d13d560db1d62a30bd2ed42ec884a",
          "name": "file2",
          "path": "src/axios/file2.ts",
          "source": "",
          "sources": [],
        },
        {
          "baseName": "file2.ts",
          "extName": "ts",
          "id": "e34a2b4ba76d4cbf9506f09ece67ec9367640742",
          "name": "file2",
          "path": "src/axios/file1.ts",
          "source": "",
          "sources": [],
        },
        {
          "baseName": "index.ts",
          "extName": "ts",
          "id": "f6fe5e984e8fd6c9c01fea19edd45c5e068d0732",
          "name": "index",
          "path": "src/axios/index.ts",
          "source": "",
          "sources": [],
        },
        {
          "baseName": "test.ts",
          "extName": "ts",
          "id": "f4bf4d03264616094b7a0e40386a6ed4cfed0aa2",
          "name": "test",
          "path": "src/controller/test.ts",
          "source": "",
          "sources": [],
        },
        {
          "baseName": "pet.ts",
          "extName": "ts",
          "id": "036b52e7de3d809b6a101e0e6909a62371c5b974",
          "name": "pet",
          "path": "src/axios/controller/pet.ts",
          "source": "",
          "sources": [],
        },
      ]
    `)
  })

  test('fileManager.groupedFiles', async () => {
    const fileManager = new FileManager()
    await fileManager.add({
      path: 'src/axios/file2.ts',
      baseName: 'file2.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/controller/test.ts',
      baseName: 'test.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/axios/file1.ts',
      baseName: 'file2.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/test.ts',
      baseName: 'test.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/axios/controller/pet.ts',
      baseName: 'pet.ts',
      sources: [],
    })

    await fileManager.add({
      path: 'src/axios/index.ts',
      baseName: 'index.ts',
      sources: [],
    })

    expect(fileManager.groupedFiles).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "children": [
              {
                "children": [
                  {
                    "file": {
                      "baseName": "file2.ts",
                      "extName": "ts",
                      "id": "4f7babf4969d13d560db1d62a30bd2ed42ec884a",
                      "name": "file2",
                      "path": "src/axios/file2.ts",
                      "source": "",
                      "sources": [],
                    },
                    "name": "file2.ts",
                    "path": "src/axios/file2.ts",
                  },
                  {
                    "file": {
                      "baseName": "file2.ts",
                      "extName": "ts",
                      "id": "e34a2b4ba76d4cbf9506f09ece67ec9367640742",
                      "name": "file2",
                      "path": "src/axios/file1.ts",
                      "source": "",
                      "sources": [],
                    },
                    "name": "file1.ts",
                    "path": "src/axios/file1.ts",
                  },
                  {
                    "children": [
                      {
                        "file": {
                          "baseName": "pet.ts",
                          "extName": "ts",
                          "id": "036b52e7de3d809b6a101e0e6909a62371c5b974",
                          "name": "pet",
                          "path": "src/axios/controller/pet.ts",
                          "source": "",
                          "sources": [],
                        },
                        "name": "pet.ts",
                        "path": "src/axios/controller/pet.ts",
                      },
                    ],
                    "name": "controller",
                    "path": "src/axios/controller",
                  },
                  {
                    "file": {
                      "baseName": "index.ts",
                      "extName": "ts",
                      "id": "f6fe5e984e8fd6c9c01fea19edd45c5e068d0732",
                      "name": "index",
                      "path": "src/axios/index.ts",
                      "source": "",
                      "sources": [],
                    },
                    "name": "index.ts",
                    "path": "src/axios/index.ts",
                  },
                ],
                "name": "axios",
                "path": "src/axios",
              },
              {
                "children": [
                  {
                    "file": {
                      "baseName": "test.ts",
                      "extName": "ts",
                      "id": "f4bf4d03264616094b7a0e40386a6ed4cfed0aa2",
                      "name": "test",
                      "path": "src/controller/test.ts",
                      "source": "",
                      "sources": [],
                    },
                    "name": "test.ts",
                    "path": "src/controller/test.ts",
                  },
                ],
                "name": "controller",
                "path": "src/controller",
              },
              {
                "file": {
                  "baseName": "test.ts",
                  "extName": "ts",
                  "id": "19a844882848cd1bf8e191680a1c70df04b6e0db",
                  "name": "test",
                  "path": "src/test.ts",
                  "source": "",
                  "sources": [],
                },
                "name": "test.ts",
                "path": "src/test.ts",
              },
            ],
            "name": "src",
            "path": "src",
          },
        ],
        "name": "",
        "path": "",
      }
    `)
  })
})

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', async () => {
    const code = await getSource({
      baseName: 'test.ts',
      path: 'models/ts/test.ts',
      imports: [
        {
          name: ['Pets'],
          path: './Pets',
          isTypeOnly: true,
        },
      ],
      sources: [
        {
          value: 'export type Pet = Pets;',
        },
      ],
    })
    const codeWithDefaultImport = await getSource({
      baseName: 'test.ts',
      path: 'models/ts/test.ts',
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
      sources: [
        {
          value: 'export type Pet = Pets | Cat; const test = [client, React];',
        },
      ],
    })
    const codeWithDefaultImportOrder = await getSource({
      baseName: 'test.ts',
      path: 'models/ts/test.ts',
      sources: [
        {
          value: 'export type Pet = Pets | Cat;\nconst test = [client, React];',
        },
      ],
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

    expect(await format(code)).toMatchSnapshot()
    expect(await format(codeWithDefaultImport)).toMatchSnapshot()
    expect(await format(codeWithDefaultImportOrder)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with imports and default import', async () => {
    const code = await getSource({
      baseName: 'test.ts',
      path: 'models/ts/test.ts',
      sources: [
        {
          value: 'export type Pet = Pets;',
        },
      ],
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

  test('if getFileSource is returning code with exports and exports as', async () => {
    const fileImport: KubbFile.File = {
      path: './src/models/file1.ts',
      baseName: 'file1.ts',
      sources: [
        {
          value: `export const test = 2;
        type Test = Pets | Lily | Dog;`,
        },
      ],
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
      path: './src/models/file1.ts',
      baseName: 'file1.ts',
      sources: [],
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
