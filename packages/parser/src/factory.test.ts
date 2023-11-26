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
} from './factory.ts'
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
    ).toMatchSnapshot()
  })
  test('createUnionDeclaration', () => {
    expect(
      print(
        createUnionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        }),
      ),
    ).toMatchSnapshot()
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
    ).toMatchSnapshot()
  })

  test('createParameter', () => {
    expect(print(createParameterSignature('hello', { type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) }))).toMatchSnapshot()
    expect(print(createParameterSignature('hello', { questionToken: true, type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) })))
      .toMatchSnapshot()
    expect(print(createParameterSignature('hello', { questionToken: true, type: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword) })))
      .toMatchSnapshot()
  })

  test('createJSDoc', async () => {
    expect(
      await formatTS(
        createJSDoc({
          comments: ['@description description', '@example example'],
        }),
      ),
    ).toMatchSnapshot()
  })

  test('appendJSDocToNode', async () => {
    expect(
      await formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: ['@description description', undefined, '@example example'],
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: [],
        }),
      ),
    ).toMatchSnapshot()
  })

  test('createImportDeclaration', async () => {
    expect(
      await formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
          isTypeOnly: true,
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        createImportDeclaration({
          name: ['hello'],
          path: './hello.ts',
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        createImportDeclaration({
          name: 'hello',
          path: './hello.ts',
          isNameSpace: true,
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        createImportDeclaration({
          name: [{ propertyName: 'hello', name: 'helloWorld' }],
          path: './hello.ts',
        }),
      ),
    ).toMatchSnapshot()
  })

  test('createExportDeclaration', async () => {
    expect(
      await formatTS(
        createExportDeclaration({
          path: './hello.ts',
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        createExportDeclaration({
          name: ['hello', 'world'],
          asAlias: true,
          path: './hello.ts',
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        createExportDeclaration({
          name: 'hello',
          asAlias: true,
          path: './hello.ts',
        }),
      ),
    ).toMatchSnapshot()

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
    ).toMatchSnapshot()

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
    ).toMatchSnapshot()

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
    ).toMatchSnapshot()
  })
})
