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
  return format(print(...[elements].flat().filter(Boolean)))
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
        createArrayDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })!,
      ),
    ).toMatchSnapshot()

    expect(
      print(
        createArrayDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
        })!,
      ),
    ).toMatchSnapshot()
  })

  test('createIntersectionDeclaration', () => {
    expect(
      print(
        createIntersectionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })!,
      ),
    ).toMatchSnapshot()
  })
  test('createUnionDeclaration', () => {
    expect(
      print(
        createUnionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })!,
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
        })!,
      ),
    ).toMatchSnapshot()
  })

  test('createParameter', () => {
    expect(
      print(
        createParameterSignature('hello', {
          type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        })!,
      ),
    ).toMatchSnapshot()
    expect(
      print(
        createParameterSignature('hello', {
          questionToken: true,
          type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        })!,
      ),
    ).toMatchSnapshot()
    expect(
      print(
        createParameterSignature('hello', {
          questionToken: true,
          type: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
        })!,
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

    // Test that imports are sorted alphabetically
    expect(
      await formatTS(
        createImportDeclaration({
          name: ['zebra', 'apple', 'banana'],
          path: './fruits.ts',
        }),
      ),
    ).toMatchSnapshot()

    // Test that imports with mixed objects and strings are sorted
    expect(
      await formatTS(
        createImportDeclaration({
          name: ['zoo', { propertyName: 'apple' }, 'banana', { propertyName: 'cat', name: 'dog' }],
          path: './mixed.ts',
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

    // Test that exports are sorted alphabetically
    expect(
      await formatTS(
        createExportDeclaration({
          name: ['zebra', 'apple', 'banana'],
          path: './fruits.ts',
        }),
      ),
    ).toMatchSnapshot()
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

describe('Import/Export Sorting Consistency', () => {
  test('imports with different input order should produce identical sorted output', () => {
    const import1 = createImportDeclaration({
      name: ['zebra', 'apple', 'banana', 'cat'],
      path: './test.ts',
    })

    const import2 = createImportDeclaration({
      name: ['cat', 'banana', 'zebra', 'apple'],
      path: './test.ts',
    })

    const output1 = print(import1)
    const output2 = print(import2)

    // Both should produce the same sorted output
    expect(output1).toBe(output2)
    expect(output1).toContain('apple, banana, cat, zebra')
  })

  test('exports with different input order should produce identical sorted output', () => {
    const export1 = createExportDeclaration({
      name: ['zoo', 'apple', 'monkey'],
      path: './animals.ts',
    })

    const export2 = createExportDeclaration({
      name: ['monkey', 'zoo', 'apple'],
      path: './animals.ts',
    })

    const output1 = print(export1)
    const output2 = print(export2)

    // Both should produce the same sorted output
    expect(output1).toBe(output2)
    expect(output1).toContain('apple, monkey, zoo')
  })

  test('mixed string and object imports should be sorted by property name', () => {
    const import1 = createImportDeclaration({
      name: ['zoo', { propertyName: 'apple' }, 'monkey', { propertyName: 'banana', name: 'yellow' }],
      path: './mixed.ts',
    })

    const output = print(import1)

    // Should be sorted alphabetically: apple, banana as yellow, monkey, zoo
    expect(output).toContain('apple, banana as yellow, monkey, zoo')
  })

  test('demonstrates consistency across different orders - real world scenario', () => {
    // Simulating how imports might be collected on different OS/filesystem orders
    const linuxOrder = ['UserService', 'AuthService', 'DatabaseService', 'CacheService']
    const windowsOrder = ['CacheService', 'UserService', 'DatabaseService', 'AuthService']
    const macOrder = ['DatabaseService', 'AuthService', 'CacheService', 'UserService']

    const import1 = createImportDeclaration({ name: linuxOrder, path: './services.ts' })
    const import2 = createImportDeclaration({ name: windowsOrder, path: './services.ts' })
    const import3 = createImportDeclaration({ name: macOrder, path: './services.ts' })

    const output1 = print(import1)
    const output2 = print(import2)
    const output3 = print(import3)

    // All three should produce identical output regardless of input order
    expect(output1).toBe(output2)
    expect(output2).toBe(output3)
    expect(output1).toContain('AuthService, CacheService, DatabaseService, UserService')
  })
})
