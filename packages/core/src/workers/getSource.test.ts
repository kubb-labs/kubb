import path from 'node:path'

import { format } from '../../mocks/format.ts'
import getSource from './getSource.ts'

describe('FileManager utils', () => {
  test('if getFileSource is returning code with imports', async () => {
    const code = getSource({
      file: {
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
      },
    })
    const codeWithDefaultImport = getSource({
      file: {
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
      },
    })
    const codeWithDefaultImportOrder = getSource({
      file: {
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
      },
    })

    expect(await format(code)).toMatchSnapshot()
    expect(await format(codeWithDefaultImport)).toMatchSnapshot()
    expect(await format(codeWithDefaultImportOrder)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with imports and default import', async () => {
    const code = getSource({
      file: {
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
      },
    })
    expect(await format(code)).toMatchSnapshot()
  })

  test('if getFileSource is returning code with exports and exports as', async () => {
    const codeImport = getSource({
      file: {
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
      },
    })

    const codeExport = getSource({
      file: {
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
      },
    })

    expect(await format(codeImport)).toMatchSnapshot()
    expect(await format(codeExport)).toMatchSnapshot()
  })

  test('if getFileSource is setting `process.env` based on `env` object', async () => {
    const codeImport = getSource({
      file: {
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
      },
    })

    const codeImportAdvanced = getSource({
      file: {
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
      },
    })

    const codeImportDeclareModule = getSource({
      file: {
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
      },
    })

    expect(await format(codeImport)).toMatchSnapshot()
    expect(await format(codeImportAdvanced)).toMatchSnapshot()
    expect(await format(codeImportDeclareModule)).toMatchSnapshot()
  })

  test('if combineExports is filtering out duplicated exports', async () => {
    const code = getSource({
      file: {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: '',
        exports: [
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
        ],
      },
    })

    expect(await format(code)).toMatchSnapshot()
  })

  test('if combineImports is filtering out duplicated imports', async () => {
    const code = getSource({
      file: {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: 'const test = models; type Test = Config;',
        imports: [
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
        ],
      },
    })

    expect(await format(code)).toMatchSnapshot()

    const codeWithoutSource = getSource({
      file: {
        path: path.resolve('./src/models/file1.ts'),
        baseName: 'file1.ts',
        source: '',
        imports: [
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
        ],
      },
    })

    expect(await format(code)).toMatchSnapshot()
  })

  test.todo('if combineImports is excluding imports when import path and file path are the same')
})
