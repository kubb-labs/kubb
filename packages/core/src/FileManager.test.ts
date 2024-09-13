import path from 'node:path'

import { format } from '../mocks/format.ts'
import { FileManager, combineExports, combineImports, combineSources, getSource } from './FileManager.ts'

import type * as KubbFile from '@kubb/fs/types'
import { createFile } from './utils'

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

    expect(file.sources).toMatchInlineSnapshot(`
      [
        {
          "value": "const file1 ='file1';",
        },
        {
          "value": "const file1Bis ='file1Bis';",
        },
      ]
    `)
    expect(file.imports).toMatchInlineSnapshot(`
      [
        {
          "extName": "",
          "name": "fs",
          "path": "node:fs",
        },
        {
          "extName": "",
          "name": "path",
          "path": "node:path",
        },
      ]
    `)
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

    const files = fileManager.orderedFiles

    expect(JSON.stringify(files, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/ordered.json'))
  })

  test('fileManager.getBarrelFiles', async () => {
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
      },
    ]

    const barrelFiles = await fileManager.getBarrelFiles({
      files,
      root: 'src',
      output: {
        path: '.',
      },
    })

    await fileManager.add(...barrelFiles)

    expect(JSON.stringify(fileManager.files, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/barrel.json'))
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
    const files = fileManager.groupedFiles

    expect(JSON.stringify(files, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/grouped.json'))
  })
})

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', async () => {
    const code = await getSource(
      createFile({
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
      }),
    )

    const codeWithDefaultImport = await getSource(
      createFile({
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
      }),
    )

    const codeWithDefaultImportOrder = await getSource(
      createFile({
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
      }),
    )

    expect(await format(code)).toMatchSnapshot()
    expect(await format(codeWithDefaultImport)).toMatchSnapshot()
    expect(await format(codeWithDefaultImportOrder)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with imports and default import', async () => {
    const code = await getSource(
      createFile({
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
      }),
    )
    expect(await format(code)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with exports and exports as', async () => {
    const fileImport = createFile({
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
    })

    const fileExport = createFile({
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
    })

    expect(await format(await getSource(fileImport))).toMatchSnapshot()
    expect(await format(await getSource(fileExport))).toMatchSnapshot()
  })

  test('if combineExports is filtering out duplicated sources(by name)', () => {
    const sources: Array<KubbFile.Source> = [
      {
        name: 'test',
        isTypeOnly: false,
        value: 'const test = 2',
      },
      {
        name: 'test',
        isTypeOnly: false,
        value: 'const test = 3',
      },
      {
        name: 'Test',
        isTypeOnly: false,
        value: 'type Test = 2',
      },
    ]

    expect(combineSources(sources)).toMatchInlineSnapshot(`
      [
        {
          "isExportable": undefined,
          "isIndexable": undefined,
          "isTypeOnly": false,
          "name": "test",
          "value": "const test = 3",
        },
        {
          "isTypeOnly": false,
          "name": "Test",
          "value": "type Test = 2",
        },
      ]
    `)
  })

  test('if combineExports is filtering out duplicated exports(by path and name)', () => {
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

  test('if combineImports is filtering out duplicated imports(by path and name)', () => {
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

    expect(combineImports(imports, [], 'const test = models; type Test = Config;')).toMatchInlineSnapshot(`
      [
        {
          "isTypeOnly": true,
          "name": "models",
          "path": "./models",
        },
        {
          "isTypeOnly": true,
          "name": [
            "Config",
          ],
          "path": "./models",
        },
      ]
    `)

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
