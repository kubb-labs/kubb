import ts from 'typescript'

import { format as prettierFormat } from '../mocks/format.ts'
import {
  appendJSDocToNode,
  createEnumDeclaration,
  createExportDeclaration,
  createImportDeclaration,
  createIntersectionDeclaration,
  createJSDoc,
  createParameterSignature,
  createPropertySignature,
  createQuestionToken,
  createUnionDeclaration,
  modifiers,
} from './codegen.ts'
import { print } from './print.ts'

const { factory } = ts

describe('codegen', () => {
  const node = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier('hello'), undefined, undefined, factory.createStringLiteral('world'))],
      ts.NodeFlags.Const,
    ),
  )

  const formatTS = (elements: ts.Node | (ts.Node | undefined)[]) => {
    return prettierFormat(print(elements))
  }

  test('createQuestionToken', () => {
    expect(createQuestionToken()).toBeUndefined()
    expect(createQuestionToken(true)).toBeDefined()
  })

  test('createIntersectionDeclaration', () => {
    expect(
      print(
        createIntersectionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        }),
      ),
    ).toBe('string & number\n')
  })
  test('createUnionDeclaration', () => {
    expect(
      print(
        createUnionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        }),
      ),
    ).toBe('string | number\n')
  })
  test('createPropertySignature', () => {
    expect(
      print(
        createPropertySignature({
          modifiers: [modifiers.const],
          name: 'hello',
          type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        }),
      ),
    ).toBe('const hello: string;\n')
  })

  test('createParameter', () => {
    expect(print(createParameterSignature('hello', { type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) }))).toBe(`hello: string\n`)
    expect(print(createParameterSignature('hello', { questionToken: true, type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) }))).toBe(
      `hello?: string\n`,
    )
    expect(print(createParameterSignature('hello', { questionToken: true, type: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword) }))).toBe(
      `hello?: boolean\n`,
    )
  })

  test('createJSDoc', async () => {
    expect(
      await formatTS(
        createJSDoc({
          comments: ['@description description', '@example example'],
        }),
      ),
    ).toBe(
      await prettierFormat(`
      /**
        * @description description
        * @example example */
       `),
    )
  })

  test('appendJSDocToNode', async () => {
    expect(
      await formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: ['@description description', undefined, '@example example'],
        }),
      ),
    ).toBe(
      await prettierFormat(`
      /**
        * @description description
        * @example example 
        */
      const hello = 'world'; 
      `),
    )

    expect(
      await formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: [],
        }),
      ),
    ).toBe(
      await prettierFormat(`
      const hello = 'world'; 
      
      `),
    )
  })

  test('createImportDeclaration', async () => {
    expect(
      await formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
        }),
      ),
    ).toBe(
      await prettierFormat(`
        import hello from './hello.ts';
      `),
    )

    expect(
      await formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
          isTypeOnly: true,
        }),
      ),
    ).toBe(
      await prettierFormat(`
      import type hello from './hello.ts';
    `),
    )

    expect(
      await formatTS(
        createImportDeclaration({
          name: ['hello'],
          path: './hello.ts',
        }),
      ),
    ).toBe(
      await prettierFormat(`
      import { hello } from './hello.ts';
    `),
    )

    expect(
      await formatTS(
        createImportDeclaration({
          name: [{ propertyName: 'hello', name: 'helloWorld' }],
          path: './hello.ts',
        }),
      ),
    ).toBe(
      await prettierFormat(`
      import { hello as helloWorld } from './hello.ts';
    `),
    )
  })

  test('createExportDeclaration', async () => {
    expect(
      await formatTS(
        createExportDeclaration({
          path: './hello.ts',
        }),
      ),
    ).toBe(
      await prettierFormat(`
        export * from './hello.ts';
      `),
    )

    expect(
      await formatTS(
        createExportDeclaration({
          name: ['hello', 'world'],
          asAlias: true,
          path: './hello.ts',
        }),
      ),
    ).toBe(
      await prettierFormat(`
        export { hello, world } from './hello.ts';
      `),
    )

    expect(
      await formatTS(
        createExportDeclaration({
          name: 'hello',
          asAlias: true,
          path: './hello.ts',
        }),
      ),
    ).toBe(
      await prettierFormat(`
        export * as hello from './hello.ts';
      `),
    )

    try {
      await formatTS(
        createExportDeclaration({
          name: 'hello',
          path: './hello.ts',
        }),
      )
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  test('createEnumDeclaration', async () => {
    expect(
      await formatTS(
        createEnumDeclaration({
          type: 'enum',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['hello', 'world'],
            ['end', 2050],
            ['survive', true],
          ],
        }),
      ),
    ).toBe(
      await prettierFormat(`
      export enum Hello {
        'hello' = 'world',
        'end' = 2050,
        'survive' = true
      }
      `),
    )

    expect(
      await formatTS(
        createEnumDeclaration({
          type: 'asConst',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['hello', 'world'],
            ['end', 2050],
            ['survive', true],
          ],
        }),
      ),
    ).toBe(
      await prettierFormat(`
      export const hello = {
        'hello': 'world',
        'end': 2050,
        'survive': true
      } as const
      export type Hello = (typeof hello)[keyof typeof hello]
      `),
    )

    expect(
      await formatTS(
        createEnumDeclaration({
          type: 'asPascalConst',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['hello', 'world'],
            ['end', 2050],
            ['survive', true],
          ],
        }),
      ),
    ).toBe(
      await prettierFormat(`
      export const Hello = {
        'hello': 'world',
        'end': 2050,
        'survive': true
      } as const
      export type Hello = (typeof Hello)[keyof typeof Hello]
      `),
    )
  })
})
