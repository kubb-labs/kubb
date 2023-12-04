import path from 'node:path'

import { format } from '../mocks/format.ts'
import { Queue } from './utils/Queue.ts'
import { combineExports, combineImports, FileManager } from './FileManager.ts'

import type { KubbFile } from './FileManager.ts'

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

    const file2 = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1 ='file1';",
      imports: [{ name: 'path', path: 'node:path' }],
    }, {
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1 ='file1';",
      imports: [{ name: 'path', path: 'node:path' }],
    })

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

  test('fileManager.getCacheByUUID', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    const resolvedFile = fileManager.getCacheByUUID(file.id)

    if (resolvedFile) {
      expect(resolvedFile).toBeDefined()
      expect(resolvedFile.source).toBe(file.source)
    }
  })

  test('fileManager queue', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    expect(taskMock).toHaveBeenCalled()
  })

  test('fileManager.remove', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    const file = await fileManager.add({
      path: path.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.remove(file.path)

    const expectedRemovedFile = fileManager.files.find((f) => f.path === file.path)

    expect(expectedRemovedFile).toBeUndefined()
    expect(taskMock).toHaveBeenCalled()
  })

  test('if getMode returns correct PathMode(file or directory)', () => {
    expect(FileManager.getMode(filePath)).toBe('file')
    expect(FileManager.getMode(folderPath)).toBe('directory')
    expect(FileManager.getMode(undefined)).toBe('directory')
    expect(FileManager.getMode(null)).toBe('directory')
  })

  test.todo('fileManager.addIndexes')
})

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', async () => {
    const code = FileManager.getSource({
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
    const codeWithDefaultImport = FileManager.getSource({
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
    const codeWithDefaultImportOrder = FileManager.getSource({
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

    expect(await format(code)).toMatchSnapshot()
    expect(await format(codeWithDefaultImport)).toMatchSnapshot()
    expect(await format(codeWithDefaultImportOrder)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with imports and default import', async () => {
    const code = FileManager.getSource({
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

    expect(await format(FileManager.getSource(fileImport))).toMatchSnapshot()
    expect(await format(FileManager.getSource(fileExport))).toMatchSnapshot()
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

    expect(await format(FileManager.getSource(fileImport))).toMatchSnapshot()
    expect(await format(FileManager.getSource(fileImportAdvanced))).toMatchSnapshot()
    expect(await format(FileManager.getSource(fileImportDeclareModule))).toMatchSnapshot()
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

    expect(combineExports(exports)).toEqual([exports[2], exports[0]])
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

  test.todo('if combineImports is excluding imports when import path and file path are the same')
})
