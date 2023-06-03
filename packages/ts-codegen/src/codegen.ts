import ts from 'typescript'

const { factory } = ts

export const modifier = {
  async: factory.createModifier(ts.SyntaxKind.AsyncKeyword),
  export: factory.createModifier(ts.SyntaxKind.ExportKeyword),
} as const

export function isValidIdentifier(str: string) {
  if (!str.length || str.trim() !== str) return false
  const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest)

  return !!node && node.kind === ts.SyntaxKind.Identifier && ts.identifierToKeywordKind(node.kind as unknown as ts.Identifier) === undefined
}

function propertyName(name: string | ts.PropertyName): ts.PropertyName {
  if (typeof name === 'string') {
    return isValidIdentifier(name) ? factory.createIdentifier(name) : factory.createStringLiteral(name)
  }
  return name
}

export const questionToken = factory.createToken(ts.SyntaxKind.QuestionToken)

export function createQuestionToken(token?: boolean | ts.QuestionToken) {
  if (!token) return undefined
  if (token === true) return questionToken
  return token
}

export function createPropertySignature({
  modifiers,
  name,
  questionToken,
  type,
}: {
  modifiers?: Array<ts.Modifier>
  name: ts.PropertyName | string
  questionToken?: ts.QuestionToken | boolean
  type?: ts.TypeNode
}) {
  return factory.createPropertySignature(modifiers, propertyName(name), createQuestionToken(questionToken), type)
}

export function createJSDoc({ comments }: { comments: string[] }) {
  return factory.createJSDocComment(
    factory.createNodeArray(
      comments?.map((comment, i) => (i === comments.length - 1 ? factory.createJSDocText(comment) : factory.createJSDocText(`${comment}\n`)))
    )
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

  const text = filteredComments.reduce((acc, comment) => {
    return `${acc}\n* ${comment}`
  }, '*')

  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, `${text}\n`, true)
}

export function createParameter(
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
  }
): ts.ParameterDeclaration {
  return factory.createParameterDeclaration(modifiers, dotDotDotToken, name, createQuestionToken(questionToken), type, initializer)
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
  } = {}
) {
  return factory.createIndexSignature(modifiers, [createParameter(indexName, { type: indexType })], type)
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
      undefined
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
              return factory.createImportSpecifier(
                false,
                typeof obj.propertyName === 'string' ? factory.createIdentifier(obj.propertyName) : obj.propertyName,
                factory.createIdentifier(obj.name)
              )
            }
            return factory.createImportSpecifier(
              false,
              undefined,
              typeof obj.propertyName === 'string' ? factory.createIdentifier(obj.propertyName) : obj.propertyName
            )
          }

          return factory.createImportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
        })
      )
    ),
    factory.createStringLiteral(path),
    undefined
  )
}

export function createExportDeclaration({ path, asAlias, name }: { path: string; asAlias?: boolean; name?: string | Array<ts.Identifier | string> }) {
  if (!Array.isArray(name)) {
    return factory.createExportDeclaration(
      undefined,
      false,
      asAlias && name ? factory.createNamespaceExport(factory.createIdentifier(name)) : undefined,
      factory.createStringLiteral(path),
      undefined
    )
  }

  return factory.createExportDeclaration(
    undefined,
    false,
    factory.createNamedExports(
      name.map((propertyName) => {
        return factory.createExportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
      })
    ),
    factory.createStringLiteral(path),
    undefined
  )
}

export function createEnumDeclaration({
  name,
  typeName,
  enums,
  type,
}: {
  type: 'enum' | 'asConst' | 'asPascalConst'
  /**
   * Enum name in camelCase.
   */
  name: string
  /**
   * Enum name in PascalCase.
   */
  typeName: string
  enums: [key: string, value: string | number][]
}) {
  if (type === 'enum') {
    return [
      factory.createEnumDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(typeName),
        enums.map(([key, value]) => {
          return factory.createEnumMember(
            factory.createStringLiteral(`${key}`),
            typeof value === 'number' ? factory.createNumericLiteral(value) : factory.createStringLiteral(`${value}`)
          )
        })
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
                  return factory.createPropertyAssignment(
                    factory.createStringLiteral(`${key}`),
                    typeof value === 'number' ? factory.createNumericLiteral(value) : factory.createStringLiteral(`${value}`)
                  )
                }),
                true
              ),
              factory.createTypeReferenceNode(factory.createIdentifier('const'), undefined)
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    factory.createTypeAliasDeclaration(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(typeName),
      undefined,
      factory.createIndexedAccessTypeNode(
        factory.createParenthesizedType(factory.createTypeQueryNode(factory.createIdentifier(identifierName), undefined)),
        factory.createTypeOperatorNode(ts.SyntaxKind.KeyOfKeyword, factory.createTypeQueryNode(factory.createIdentifier(identifierName), undefined))
      )
    ),
  ]
}

export function createIntersectionDeclaration({ nodes }: { nodes: ts.TypeNode[] }) {
  return factory.createIntersectionTypeNode(nodes)
}

export function createTupleDeclaration({ nodes }: { nodes: ts.TypeNode[] }) {
  return factory.createTupleTypeNode(nodes)
}

export function createUnionDeclaration({ nodes }: { nodes: ts.TypeNode[] }) {
  return factory.createUnionTypeNode(nodes)
}
