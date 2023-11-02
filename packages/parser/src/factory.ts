/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import ts from 'typescript'

const { factory } = ts

// https://ts-ast-viewer.com/

export const modifiers = {
  async: factory.createModifier(ts.SyntaxKind.AsyncKeyword),
  export: factory.createModifier(ts.SyntaxKind.ExportKeyword),
  const: factory.createModifier(ts.SyntaxKind.ConstKeyword),
  static: factory.createModifier(ts.SyntaxKind.StaticKeyword),
} as const

function isValidIdentifier(str: string): boolean {
  if (!str.length || str.trim() !== str) {
    return false
  }
  const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest)

  return !!node && node.kind === ts.SyntaxKind.Identifier && ts.identifierToKeywordKind(node.kind as unknown as ts.Identifier) === undefined
}

function propertyName(name: string | ts.PropertyName): ts.PropertyName {
  if (typeof name === 'string') {
    return isValidIdentifier(name) ? factory.createIdentifier(name) : factory.createStringLiteral(name)
  }
  return name
}

const questionToken = factory.createToken(ts.SyntaxKind.QuestionToken)

export function createQuestionToken(token?: boolean | ts.QuestionToken) {
  if (!token) {
    return undefined
  }
  if (token === true) {
    return questionToken
  }
  return token
}

export function createIntersectionDeclaration({
  nodes,
  withParentheses,
}: {
  nodes: Array<ts.TypeNode>
  withParentheses?: boolean
}): ts.TypeNode | null {
  if (!nodes.length) {
    return null
  }

  if (nodes.length === 1) {
    return nodes[0] || null
  }

  const node = factory.createIntersectionTypeNode(nodes)

  if (withParentheses) {
    return factory.createParenthesizedType(node)
  }

  return node
}

/**
 * Minimum nodes length of 2
 * @example `string & number`
 */
export function createTupleDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode | null {
  if (!nodes.length) {
    return null
  }

  if (nodes.length === 1) {
    return nodes[0] || null
  }

  const node = factory.createTupleTypeNode(nodes)

  if (withParentheses) {
    return factory.createParenthesizedType(node)
  }

  return node
}
/**
 * Minimum nodes length of 2
 * @example `string | number`
 */
export function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode | null {
  if (!nodes.length) {
    return null
  }

  if (nodes.length === 1) {
    return nodes[0] || null
  }

  const node = factory.createUnionTypeNode(nodes)

  if (withParentheses) {
    return factory.createParenthesizedType(node)
  }

  return node
}

export function createPropertySignature({
  readOnly,
  modifiers = [],
  name,
  questionToken,
  type,
}: {
  readOnly?: boolean
  modifiers?: Array<ts.Modifier>
  name: ts.PropertyName | string
  questionToken?: ts.QuestionToken | boolean
  type?: ts.TypeNode
}) {
  return factory.createPropertySignature(
    [...modifiers, readOnly ? factory.createToken(ts.SyntaxKind.ReadonlyKeyword) : undefined].filter(Boolean),
    propertyName(name),
    createQuestionToken(questionToken),
    type,
  )
}

export function createParameterSignature(
  name: string | ts.BindingName,
  {
    modifiers,
    dotDotDotToken,
    questionToken,
    type,
    initializer,
  }: {
    decorators?: Array<ts.Decorator>
    modifiers?: Array<ts.Modifier>
    dotDotDotToken?: ts.DotDotDotToken
    questionToken?: ts.QuestionToken | boolean
    type?: ts.TypeNode
    initializer?: ts.Expression
  },
): ts.ParameterDeclaration {
  return factory.createParameterDeclaration(modifiers, dotDotDotToken, name, createQuestionToken(questionToken), type, initializer)
}

export function createJSDoc({ comments }: { comments: string[] }) {
  return factory.createJSDocComment(
    factory.createNodeArray(
      comments?.map((comment, i) => {
        if (i === comments.length - 1) {
          return factory.createJSDocText(comment)
        }

        return factory.createJSDocText(`${comment}\n`)
      }),
    ),
  )
}

/**
 * @link https://github.com/microsoft/TypeScript/issues/44151
 */
export function appendJSDocToNode<TNode extends ts.Node>({ node, comments }: { node: TNode; comments: Array<string | undefined> }) {
  const filteredComments = comments.filter(Boolean)

  if (!filteredComments.length) {
    return node
  }

  const text = filteredComments.reduce((acc = '', comment = '') => {
    return `${acc}\n * ${comment}`
  }, '*')

  // node: {...node}, with that ts.addSyntheticLeadingComment is appending
  return ts.addSyntheticLeadingComment({ ...node }, ts.SyntaxKind.MultiLineCommentTrivia, `${text || '*'}\n`, true)
}

export function createIndexSignature(
  type: ts.TypeNode,
  {
    modifiers,
    indexName = 'key',
    indexType = factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  }: {
    indexName?: string
    indexType?: ts.TypeNode
    decorators?: Array<ts.Decorator>
    modifiers?: Array<ts.Modifier>
  } = {},
) {
  return factory.createIndexSignature(modifiers, [createParameterSignature(indexName, { type: indexType })], type)
}

export function createTypeAliasDeclaration({
  modifiers,
  name,
  typeParameters,
  type,
}: {
  modifiers?: Array<ts.Modifier>
  name: string | ts.Identifier
  typeParameters?: Array<ts.TypeParameterDeclaration>
  type: ts.TypeNode
}) {
  return factory.createTypeAliasDeclaration(modifiers, name, typeParameters, type)
}

export function createNamespaceDeclaration({
  statements,
  name,
}: {
  name: string
  statements: ts.Statement[]
}) {
  return factory.createModuleDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createIdentifier(name),
    factory.createModuleBlock(statements),
    ts.NodeFlags.Namespace,
  )
}

/**
 * In { propertyName: string; name?: string } is `name` being used to make the type more unique when multiple same names are used.
 * @example `import { Pet as Cat } from './Pet'`
 */
export function createImportDeclaration({
  name,
  path,
  isTypeOnly = false,
}: {
  name: string | Array<ts.Identifier | string | { propertyName: string; name?: string }>
  path: string
  isTypeOnly?: boolean
}) {
  if (!Array.isArray(name)) {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(isTypeOnly, factory.createIdentifier(name), undefined),
      factory.createStringLiteral(path),
      undefined,
    )
  }

  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      isTypeOnly,
      undefined,
      factory.createNamedImports(
        name.map((propertyName) => {
          if (typeof propertyName === 'object') {
            const obj = propertyName as { propertyName: string; name?: string }
            if (obj.name) {
              return factory.createImportSpecifier(false, factory.createIdentifier(obj.propertyName), factory.createIdentifier(obj.name))
            }
            return factory.createImportSpecifier(false, undefined, factory.createIdentifier(obj.propertyName))
          }

          return factory.createImportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
        }),
      ),
    ),
    factory.createStringLiteral(path),
    undefined,
  )
}

export function createExportDeclaration({
  path,
  asAlias,
  isTypeOnly = false,
  name,
}: {
  path: string
  asAlias?: boolean
  isTypeOnly?: boolean
  name?: string | Array<ts.Identifier | string>
}) {
  if (name && !Array.isArray(name) && !asAlias) {
    throw new Error('When using `name` as string, `asAlias` should be true')
  }

  if (!Array.isArray(name)) {
    const parsedName = name?.match(/^\d/) ? `_${name?.slice(1)}` : name

    return factory.createExportDeclaration(
      undefined,
      isTypeOnly,
      asAlias && parsedName ? factory.createNamespaceExport(factory.createIdentifier(parsedName)) : undefined,
      factory.createStringLiteral(path),
      undefined,
    )
  }

  return factory.createExportDeclaration(
    undefined,
    isTypeOnly,
    factory.createNamedExports(
      name.map((propertyName) => {
        return factory.createExportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
      }),
    ),
    factory.createStringLiteral(path),
    undefined,
  )
}

export function createEnumDeclaration({
  type = 'enum',
  name,
  typeName,
  enums,
}: {
  /**
   * @default `'enum'`
   */
  type?: 'enum' | 'asConst' | 'asPascalConst'
  /**
   * Enum name in camelCase.
   */
  name: string
  /**
   * Enum name in PascalCase.
   */
  typeName: string
  enums: [key: string | number, value: string | number | boolean][]
}) {
  if (type === 'enum') {
    return [
      factory.createEnumDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(typeName),
        enums.map(([key, value]) => {
          let initializer: ts.Expression = factory.createStringLiteral(`${value?.toString()}`)

          if (typeof value === 'number') {
            initializer = factory.createNumericLiteral(value)
          }
          if (typeof value === 'boolean') {
            initializer = value ? factory.createTrue() : factory.createFalse()
          }

          if (typeof key === 'number') {
            return factory.createEnumMember(factory.createStringLiteral(`${typeName}_${key}`), initializer)
          }

          return factory.createEnumMember(factory.createStringLiteral(`${key}`), initializer)
        }),
      ),
    ]
  }

  // used when using `as const` instead of an TypeScript enum.
  const identifierName = type === 'asPascalConst' ? typeName : name

  return [
    factory.createVariableStatement(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(identifierName),
            undefined,
            undefined,
            factory.createAsExpression(
              factory.createObjectLiteralExpression(
                enums.map(([key, value]) => {
                  let initializer: ts.Expression = factory.createStringLiteral(`${value?.toString()}`)

                  if (typeof value === 'number') {
                    initializer = factory.createNumericLiteral(value)
                  }
                  if (typeof value === 'boolean') {
                    initializer = value ? factory.createTrue() : factory.createFalse()
                  }

                  return factory.createPropertyAssignment(factory.createStringLiteral(`${key}`), initializer)
                }),
                true,
              ),
              factory.createTypeReferenceNode(factory.createIdentifier('const'), undefined),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    factory.createTypeAliasDeclaration(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(typeName),
      undefined,
      factory.createIndexedAccessTypeNode(
        factory.createParenthesizedType(factory.createTypeQueryNode(factory.createIdentifier(identifierName), undefined)),
        factory.createTypeOperatorNode(ts.SyntaxKind.KeyOfKeyword, factory.createTypeQueryNode(factory.createIdentifier(identifierName), undefined)),
      ),
    ),
  ]
}

export function createOmitDeclaration({ keys, type, nonNullable }: { keys: Array<string> | string; type: ts.TypeNode; nonNullable?: boolean }) {
  const node = nonNullable ? factory.createTypeReferenceNode(factory.createIdentifier('NonNullable'), [type]) : type

  if (Array.isArray(keys)) {
    return factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [
      node,
      factory.createUnionTypeNode(
        keys.map((key) => {
          return factory.createLiteralTypeNode(factory.createStringLiteral(key))
        }),
      ),
    ])
  }

  return factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [node, factory.createLiteralTypeNode(factory.createStringLiteral(keys))])
}

export const keywordTypeNodes = {
  any: factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  number: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  integer: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  object: factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
  string: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  boolean: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
  undefined: factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
  null: factory.createLiteralTypeNode(factory.createToken(ts.SyntaxKind.NullKeyword)),
} as const

export const createTypeLiteralNode = factory.createTypeLiteralNode

export const createTypeReferenceNode = factory.createTypeReferenceNode
export const createNumericLiteral = factory.createNumericLiteral
export const createStringLiteral = factory.createStringLiteral

export const createArrayTypeNode = factory.createArrayTypeNode

export const createLiteralTypeNode = factory.createLiteralTypeNode
export const createNull = factory.createNull
export const createIdentifier = factory.createIdentifier
