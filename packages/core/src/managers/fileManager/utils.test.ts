import path from 'node:path'

import { isBun } from 'js-runtime'

import { format } from '../../../mocks/format.ts'
import { combineExports, combineFiles, combineImports, createFileSource, getIndexes } from './utils.ts'

import type { KubbFile } from './types.ts'

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', async () => {
    const code = createFileSource({
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
    const codeWithDefaultImport = createFileSource({
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
    const codeWithDefaultImportOrder = createFileSource({
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

    expect(await format(code)).toMatch(
      await format(`
    import type { Pets } from './Pets'

    export type Pet = Pets

   `),
    )

    expect(await format(codeWithDefaultImport)).toMatch(
      await format(`
    import client from './Pets'
    import React from './React'
    import type { Pets, Cat } from './Pets'

    export type Pet = Pets | Cat
    const test = [client, React]

   `),
    )

    expect(await format(codeWithDefaultImportOrder)).toMatch(
      await format(`
    import client from './Pets'
    import React from './React'
    import type { Pets, Cat } from './Pets'

    export type Pet = Pets | Cat
    const test = [client, React]

   `),
    )
  })

  test('if getFileSource is returning code with imports and default import', async () => {
    const code = createFileSource({
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
    expect(await format(code)).toMatch(
      await format(`
    import type Pets from './Pets'

    export type Pet = Pets

   `),
    )
  })
  test('if combineFiles is removing previous code', () => {
    const combined = combineFiles([
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
    const combined = combineFiles([
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
        source: `export const test2 = 3;`,
        'override': true,
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

    expect(await format(createFileSource(fileImport))).toMatch(
      await format(`
      import type { Pets, Lily } from "./Pets";
      import type Dog from "./Dog";

      export const test = 2;
      type Test = Pets | Lily | Dog;`),
    )

    expect(await format(createFileSource(fileExport))).toEqual(
      await format(`
    export type { Pets, Lily } from "./Pets";
    export type * as Dog from "./Dog";
    `),
    )
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

    expect(combineFiles(importFiles)).toEqual([
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

    expect(combineFiles(exportFiles)).toMatchObject([
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

    expect(await format(createFileSource(fileImport))).toEqual(
      await format(`
    export const hello = "world";
    `),
    )
    expect(await format(createFileSource(fileImportAdvanced))).toEqual(
      await format(`
    import type { Pets } from "./Pets";

    export const hello = "world";
    type Test = Pets;

    `),
    )

    expect(await format(createFileSource(fileImportDeclareModule))).toEqual(
      await format(`
    import type { Pets } from "./Pets";

    export const hello = typeof "world" !== 'undefined' ? "world" : undefined
    type Test = Pets;

    `),
    )
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

  test(`if getIndexes returns 'index.ts' files`, () => {
    const rootPath = path.resolve(__dirname, '../../../mocks/treeNode')
    const files = getIndexes(rootPath) || []
    const rootIndex = files[0]

    expect(rootIndex).toBeDefined()

    expect(files?.every((file) => file.baseName === 'index.ts')).toBeTruthy()

    expect(rootIndex?.exports?.every((file) => !file.path.endsWith('.ts'))).toBeTruthy()
  })

  test('if getIndexes can return an export with `exportAs` and/or `isTypeOnly`', async () => {
    const exportAs = 'models'
    const rootPath = path.resolve(__dirname, '../../../mocks/treeNode')

    const files = getIndexes(rootPath, '.ts', {
      includeExt: true,
      map: (file) => {
        return {
          ...file,
          exports: file.exports?.map((item) => {
            if (exportAs) {
              return {
                ...item,
                name: exportAs,
                asAlias: !!exportAs,
              }
            }
            return item
          }),
        }
      },
    }) || []
    const rootIndex = files[0]!

    expect(rootIndex).toBeDefined()

    const code = createFileSource(rootIndex)

    if (isBun()) {
      // TODO check why bun is reodering the export sort

      expect(await format(code)).toMatch(
        await format(`
        export * as models from "./world.ts";
        export * as models from "./hello.ts";

     `),
      )
    } else {
      expect(await format(code)).toMatch(
        await format(`
        export * as models from "./hello.ts";
        export * as models from "./world.ts";

     `),
      )
    }

    expect(rootIndex?.exports?.every((file) => file.path.endsWith('.ts'))).toBeTruthy()
  })
  test('if getIndexes can return an export with `includeExt`', () => {
    const rootPath = path.resolve(__dirname, '../../../mocks/treeNode')
    const files = getIndexes(rootPath, '.ts', { includeExt: true }) || []
    const rootIndex = files[0]

    expect(rootIndex).toBeDefined()

    expect(rootIndex?.exports?.every((file) => file.path.endsWith('.ts'))).toBeTruthy()
  })
})
