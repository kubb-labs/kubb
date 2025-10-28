import { print } from '@kubb/fabric-core/parsers/typescript'
import ts from 'typescript'
import { format } from '#mocks'
import {
  appendJSDocToNode,
  createArrayDeclaration,
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

const { factory } = ts

const formatTS = (elements: ts.Node | (ts.Node | undefined)[]) => {
  return format(print([elements].flat().filter(Boolean)))
}

describe('codegen', () => {
  const node = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier('hello'), undefined, undefined, factory.createStringLiteral('world'))],
      ts.NodeFlags.Const,
    ),
  )

  test('createQuestionToken', () => {
    expect(createQuestionToken()).toBeUndefined()
    expect(createQuestionToken(true)).toBeDefined()
  })

  test('createArrayDeclaration', () => {
    expect(
      print(
        [
          createArrayDeclaration({
            nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()

    expect(
      print(
        [
          createArrayDeclaration({
            nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
  })

  test('createIntersectionDeclaration', () => {
    expect(
      print(
        [
          createIntersectionDeclaration({
            nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
  })
  test('createUnionDeclaration', () => {
    expect(
      print(
        [
          createUnionDeclaration({
            nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
  })
  test('createPropertySignature', () => {
    expect(
      print(
        [
          createPropertySignature({
            modifiers: [modifiers.const],
            name: 'hello',
            type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
  })

  test('createParameter', () => {
    expect(
      print(
        [
          createParameterSignature('hello', {
            type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
    expect(
      print(
        [
          createParameterSignature('hello', {
            questionToken: true,
            type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
    expect(
      print(
        [
          createParameterSignature('hello', {
            questionToken: true,
            type: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
          }),
        ].filter(Boolean),
      ),
    ).toMatchSnapshot()
  })

  test('createJSDoc', async () => {
    expect(
      await formatTS(
        createJSDoc({
          comments: ['@description description', '@example example'],
        })!,
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
          type: 'asConst',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['FILE.UPLOADED', 'FILE.UPLOADED'],
            ['FILE.PREVIEWE', 'FILE.PREVIEWE'],
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

    expect(
      await formatTS(
        createEnumDeclaration({
          type: 'constEnum',
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
          type: 'literal',
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
          type: 'enum',
          name: 'hello',
          typeName: 'Hello',
          enums: [
            ['1', 'world'],
            ['2', 2050],
            ['3', true],
          ],
        }),
      ),
    ).toMatchSnapshot()
  })
})
