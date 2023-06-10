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
      ts.NodeFlags.Const
    )
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
        })
      )
    ).toBe('string & number\n')
  })
  test('createUnionDeclaration', () => {
    expect(
      print(
        createUnionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })
      )
    ).toBe('string | number\n')
  })
  test('createPropertySignature', () => {
    expect(
      print(
        createPropertySignature({
          modifiers: [modifiers.const],
          name: 'hello',
          type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        })
      )
    ).toBe('const hello: string;\n')
  })

  test('createParameter', () => {
    expect(print(createParameterSignature('hello', { type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) }))).toBe(`hello: string\n`)
    expect(print(createParameterSignature('hello', { questionToken: true, type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) }))).toBe(
      `hello?: string\n`
    )
    expect(print(createParameterSignature('hello', { questionToken: true, type: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword) }))).toBe(
      `hello?: boolean\n`
    )
  })

  test('createJSDoc', () => {
    expect(
      formatTS(
        createJSDoc({
          comments: ['@description description', '@example example'],
        })
      )
    ).toBe(
      prettierFormat(`
      /**
        * @description description
        * @example example */
       `)
    )
  })

  test('appendJSDocToNode', () => {
    expect(
      formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: ['@description description', undefined, '@example example'],
        })
      )
    ).toBe(
      prettierFormat(`
      /**
        * @description description
        * @example example 
        */
      const hello = 'world'; 
      `)
    )

    expect(
      formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: [],
        })
      )
    ).toBe(
      prettierFormat(`
      const hello = 'world'; 
      
      `)
    )
  })

  test('createImportDeclaration', () => {
    expect(
      formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
        })
      )
    ).toBe(
      prettierFormat(`
        import hello from './hello.ts';
      `)
    )

    expect(
      formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
          isTypeOnly: true,
        })
      )
    ).toBe(
      prettierFormat(`
      import type hello from './hello.ts';
    `)
    )

    expect(
      formatTS(
        createImportDeclaration({
          name: ['hello'],
          path: './hello.ts',
        })
      )
    ).toBe(
      prettierFormat(`
      import { hello } from './hello.ts';
    `)
    )

    expect(
      formatTS(
        createImportDeclaration({
          name: [{ propertyName: 'hello', name: 'helloWorld' }],
          path: './hello.ts',
        })
      )
    ).toBe(
      prettierFormat(`
      import { hello as helloWorld } from './hello.ts';
    `)
    )
  })

  test('createExportDeclaration', () => {
    expect(
      formatTS(
        createExportDeclaration({
          path: './hello.ts',
        })
      )
    ).toBe(
      prettierFormat(`
        export * from './hello.ts';
      `)
    )

    expect(
      formatTS(
        createExportDeclaration({
          name: ['hello', 'world'],
          asAlias: true,
          path: './hello.ts',
        })
      )
    ).toBe(
      prettierFormat(`
        export { hello, world } from './hello.ts';
      `)
    )

    expect(
      formatTS(
        createExportDeclaration({
          name: 'hello',
          asAlias: true,
          path: './hello.ts',
        })
      )
    ).toBe(
      prettierFormat(`
        export * as hello from './hello.ts';
      `)
    )

    try {
      formatTS(
        createExportDeclaration({
          name: 'hello',
          path: './hello.ts',
        })
      )
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  test('createEnumDeclaration', () => {
    expect(
      formatTS(
        createEnumDeclaration({
          type: 'enum',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['hello', 'world'],
            ['end', 2050],
            ['survive', true],
          ],
        })
      )
    ).toBe(
      prettierFormat(`
      export enum Hello {
        'hello' = 'world',
        'end' = 2050,
        'survive' = true
      }
      `)
    )

    expect(
      formatTS(
        createEnumDeclaration({
          type: 'asConst',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['hello', 'world'],
            ['end', 2050],
            ['survive', true],
          ],
        })
      )
    ).toBe(
      prettierFormat(`
      export const hello = {
        'hello': 'world',
        'end': 2050,
        'survive': true
      } as const
      export type Hello = (typeof hello)[keyof typeof hello]
      `)
    )

    expect(
      formatTS(
        createEnumDeclaration({
          type: 'asPascalConst',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['hello', 'world'],
            ['end', 2050],
            ['survive', true],
          ],
        })
      )
    ).toBe(
      prettierFormat(`
      export const Hello = {
        'hello': 'world',
        'end': 2050,
        'survive': true
      } as const
      export type Hello = (typeof Hello)[keyof typeof Hello]
      `)
    )
  })
})
