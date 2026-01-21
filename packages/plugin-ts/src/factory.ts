import transformers from '@kubb/core/transformers'
import { orderBy } from 'natural-orderby'
import { isNumber } from 'remeda'
import ts from 'typescript'

const { SyntaxKind, factory } = ts

// https://ts-ast-viewer.com/

export const modifiers = {
  async: factory.createModifier(ts.SyntaxKind.AsyncKeyword),
  export: factory.createModifier(ts.SyntaxKind.ExportKeyword),
  const: factory.createModifier(ts.SyntaxKind.ConstKeyword),
  static: factory.createModifier(ts.SyntaxKind.StaticKeyword),
} as const

export const syntaxKind = {
  union: SyntaxKind.UnionType as 192,
} as const

export function getUnknownType(unknownType: 'any' | 'unknown' | 'void' | undefined) {
  if (unknownType === 'any') {
    return keywordTypeNodes.any
  }
  if (unknownType === 'void') {
    return keywordTypeNodes.void
  }

  return keywordTypeNodes.unknown
}
function isValidIdentifier(str: string): boolean {
  if (!str.length || str.trim() !== str) {
    return false
  }
  const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest)

  return !!node && node.kind === ts.SyntaxKind.Identifier && ts.identifierToKeywordKind(node.kind as unknown as ts.Identifier) === undefined
}

function propertyName(name: string | ts.PropertyName): ts.PropertyName {
  if (typeof name === 'string') {
    const isValid = isValidIdentifier(name)
    return isValid ? factory.createIdentifier(name) : factory.createStringLiteral(name)
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

export function createIntersectionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode | null {
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

export function createArrayDeclaration({ nodes, arrayType = 'array' }: { nodes: Array<ts.TypeNode>; arrayType?: 'array' | 'generic' }): ts.TypeNode | null {
  if (!nodes.length) {
    return factory.createTupleTypeNode([])
  }

  if (nodes.length === 1) {
    const node = nodes[0]
    if (!node) {
      return null
    }
    if (arrayType === 'generic') {
      return factory.createTypeReferenceNode(factory.createIdentifier('Array'), [node])
    }
    return factory.createArrayTypeNode(node)
  }

  // For union types (multiple nodes), respect arrayType preference
  const unionType = factory.createUnionTypeNode(nodes)
  if (arrayType === 'generic') {
    return factory.createTypeReferenceNode(factory.createIdentifier('Array'), [unionType])
  }
  // For array syntax with unions, we need parentheses: (string | number)[]
  return factory.createArrayTypeNode(factory.createParenthesizedType(unionType))
}

/**
 * Minimum nodes length of 2
 * @example `string | number`
 */
export function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode {
  if (!nodes.length) {
    return keywordTypeNodes.any
  }

  if (nodes.length === 1) {
    return nodes[0] as ts.TypeNode
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
  if (!comments.length) {
    return null
  }
  return factory.createJSDocComment(
    factory.createNodeArray(
      comments.map((comment, i) => {
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
    return `${acc}\n * ${comment.replaceAll('*/', '*\\/')}`
  }, '*')

  // Use the node directly instead of spreading to avoid creating Unknown nodes
  // TypeScript's addSyntheticLeadingComment accepts the node as-is
  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, `${text || '*'}\n`, true)
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

export function createInterfaceDeclaration({
  modifiers,
  name,
  typeParameters,
  members,
}: {
  modifiers?: Array<ts.Modifier>
  name: string | ts.Identifier
  typeParameters?: Array<ts.TypeParameterDeclaration>
  members: Array<ts.TypeElement>
}) {
  return factory.createInterfaceDeclaration(modifiers, name, typeParameters, undefined, members)
}

export function createTypeDeclaration({
  syntax,
  isExportable,
  comments,
  name,
  type,
}: {
  syntax: 'type' | 'interface'
  comments: Array<string | undefined>
  isExportable?: boolean
  name: string | ts.Identifier
  type: ts.TypeNode
}) {
  if (syntax === 'interface' && 'members' in type) {
    const node = createInterfaceDeclaration({
      members: type.members as Array<ts.TypeElement>,
      modifiers: isExportable ? [modifiers.export] : [],
      name,
      typeParameters: undefined,
    })

    return appendJSDocToNode({
      node,
      comments,
    })
  }

  const node = createTypeAliasDeclaration({
    type,
    modifiers: isExportable ? [modifiers.export] : [],
    name,
    typeParameters: undefined,
  })

  return appendJSDocToNode({
    node,
    comments,
  })
}

export function createNamespaceDeclaration({ statements, name }: { name: string; statements: ts.Statement[] }) {
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
  isNameSpace = false,
}: {
  name: string | Array<string | { propertyName: string; name?: string }>
  path: string
  isTypeOnly?: boolean
  isNameSpace?: boolean
}) {
  if (!Array.isArray(name)) {
    let importPropertyName: ts.Identifier | undefined = factory.createIdentifier(name)
    let importName: ts.NamedImportBindings | undefined

    if (isNameSpace) {
      importPropertyName = undefined
      importName = factory.createNamespaceImport(factory.createIdentifier(name))
    }

    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(isTypeOnly, importPropertyName, importName),
      factory.createStringLiteral(path),
      undefined,
    )
  }

  // Sort the imports alphabetically for consistent output across platforms
  const sortedName = orderBy(name, [(item) => (typeof item === 'object' ? item.propertyName : item)])

  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      isTypeOnly,
      undefined,
      factory.createNamedImports(
        sortedName.map((item) => {
          if (typeof item === 'object') {
            const obj = item as { propertyName: string; name?: string }
            if (obj.name) {
              return factory.createImportSpecifier(false, factory.createIdentifier(obj.propertyName), factory.createIdentifier(obj.name))
            }

            return factory.createImportSpecifier(false, undefined, factory.createIdentifier(obj.propertyName))
          }

          return factory.createImportSpecifier(false, undefined, factory.createIdentifier(item))
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
    console.warn(`When using name as string, asAlias should be true ${name}`)
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

  // Sort the exports alphabetically for consistent output across platforms
  const sortedName = orderBy(name, [(propertyName) => (typeof propertyName === 'string' ? propertyName : propertyName.text)])

  return factory.createExportDeclaration(
    undefined,
    isTypeOnly,
    factory.createNamedExports(
      sortedName.map((propertyName) => {
        return factory.createExportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
      }),
    ),
    factory.createStringLiteral(path),
    undefined,
  )
}

/**
 * Apply casing transformation to enum keys
 */
function applyEnumKeyCasing(key: string, casing: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none' = 'none'): string {
  if (casing === 'none') {
    return key
  }
  if (casing === 'screamingSnakeCase') {
    return transformers.screamingSnakeCase(key)
  }
  if (casing === 'snakeCase') {
    return transformers.snakeCase(key)
  }
  if (casing === 'pascalCase') {
    return transformers.pascalCase(key)
  }
  if (casing === 'camelCase') {
    return transformers.camelCase(key)
  }
  return key
}

export function createEnumDeclaration({
  type = 'enum',
  name,
  typeName,
  enums,
  enumKeyCasing = 'none',
}: {
  /**
   * Choose to use `enum`, `asConst`, `asPascalConst`, `constEnum`, or `literal` for enums.
   * - `enum`: TypeScript enum
   * - `asConst`: const with camelCase name (e.g., `petType`)
   * - `asPascalConst`: const with PascalCase name (e.g., `PetType`)
   * - `constEnum`: const enum
   * - `literal`: literal union type
   * @default `'enum'`
   */
  type?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal' | 'inlineLiteral'
  /**
   * Enum name in camelCase.
   */
  name: string
  /**
   * Enum name in PascalCase.
   */
  typeName: string
  enums: [key: string | number, value: string | number | boolean][]
  /**
   * Choose the casing for enum key names.
   * @default 'none'
   */
  enumKeyCasing?: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'
}): [name: ts.Node | undefined, type: ts.Node] {
  if (type === 'literal' || type === 'inlineLiteral') {
    return [
      undefined,
      factory.createTypeAliasDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(typeName),
        undefined,
        factory.createUnionTypeNode(
          enums
            .map(([_key, value]) => {
              if (isNumber(value)) {
                return factory.createLiteralTypeNode(factory.createNumericLiteral(value?.toString()))
              }

              if (typeof value === 'boolean') {
                return factory.createLiteralTypeNode(value ? factory.createTrue() : factory.createFalse())
              }
              if (value) {
                return factory.createLiteralTypeNode(factory.createStringLiteral(value.toString()))
              }

              return undefined
            })
            .filter(Boolean),
        ),
      ),
    ]
  }

  if (type === 'enum' || type === 'constEnum') {
    return [
      undefined,
      factory.createEnumDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword), type === 'constEnum' ? factory.createToken(ts.SyntaxKind.ConstKeyword) : undefined].filter(Boolean),
        factory.createIdentifier(typeName),
        enums
          .map(([key, value]) => {
            let initializer: ts.Expression = factory.createStringLiteral(value?.toString())
            const isExactNumber = Number.parseInt(value.toString(), 10) === value

            if (isExactNumber && isNumber(Number.parseInt(value.toString(), 10))) {
              initializer = factory.createNumericLiteral(value as number)
            }

            if (typeof value === 'boolean') {
              initializer = value ? factory.createTrue() : factory.createFalse()
            }

            if (isNumber(Number.parseInt(key.toString(), 10))) {
              const casingKey = applyEnumKeyCasing(`${typeName}_${key}`, enumKeyCasing)
              return factory.createEnumMember(propertyName(casingKey), initializer)
            }

            if (key) {
              const casingKey = applyEnumKeyCasing(key.toString(), enumKeyCasing)
              return factory.createEnumMember(propertyName(casingKey), initializer)
            }

            return undefined
          })
          .filter(Boolean),
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
                enums
                  .map(([key, value]) => {
                    let initializer: ts.Expression = factory.createStringLiteral(value?.toString())

                    if (isNumber(value)) {
                      // Error: Negative numbers should be created in combination with createPrefixUnaryExpression factory.
                      // The method createNumericLiteral only accepts positive numbers
                      // or those combined with createPrefixUnaryExpression.
                      // Therefore, we need to ensure that the number is not negative.
                      if (value < 0) {
                        initializer = factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(value)))
                      } else {
                        initializer = factory.createNumericLiteral(value)
                      }
                    }

                    if (typeof value === 'boolean') {
                      initializer = value ? factory.createTrue() : factory.createFalse()
                    }

                    if (key) {
                      const casingKey = applyEnumKeyCasing(key.toString(), enumKeyCasing)
                      return factory.createPropertyAssignment(propertyName(casingKey), initializer)
                    }

                    return undefined
                  })
                  .filter(Boolean),
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
  unknown: factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
  void: factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  number: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  integer: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  object: factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
  string: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  boolean: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
  undefined: factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
  null: factory.createLiteralTypeNode(factory.createToken(ts.SyntaxKind.NullKeyword)),
  never: factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
} as const

/**
 * Converts a path like '/pet/{petId}/uploadImage' to a template literal type
 * like `/pet/${string}/uploadImage`
 */
export function createUrlTemplateType(path: string): ts.TypeNode {
  // If no parameters, return literal string type
  if (!path.includes('{')) {
    return factory.createLiteralTypeNode(factory.createStringLiteral(path))
  }

  // Split path by parameter placeholders, e.g. '/pet/{petId}/upload' -> ['/pet/', 'petId', '/upload']
  const segments = path.split(/(\{[^}]+\})/)

  // Separate static parts from parameter placeholders
  const parts: string[] = []
  const parameterIndices: number[] = []

  segments.forEach((segment) => {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      // This is a parameter placeholder
      parameterIndices.push(parts.length)
      parts.push(segment) // Will be replaced with ${string}
    } else if (segment) {
      // This is a static part
      parts.push(segment)
    }
  })

  // Build template literal type
  // Template literal structure: head + templateSpans[]
  // For '/pet/{petId}/upload': head = '/pet/', spans = [{ type: string, literal: '/upload' }]

  const head = ts.factory.createTemplateHead(parts[0] || '')
  const templateSpans: ts.TemplateLiteralTypeSpan[] = []

  parameterIndices.forEach((paramIndex, i) => {
    const isLast = i === parameterIndices.length - 1
    const nextPart = parts[paramIndex + 1] || ''

    const literal = isLast ? ts.factory.createTemplateTail(nextPart) : ts.factory.createTemplateMiddle(nextPart)

    templateSpans.push(ts.factory.createTemplateLiteralTypeSpan(keywordTypeNodes.string, literal))
  })

  return ts.factory.createTemplateLiteralType(head, templateSpans)
}

export const createTypeLiteralNode = factory.createTypeLiteralNode

export const createTypeReferenceNode = factory.createTypeReferenceNode
export const createNumericLiteral = factory.createNumericLiteral
export const createStringLiteral = factory.createStringLiteral

export const createArrayTypeNode = factory.createArrayTypeNode
export const createParenthesizedType = factory.createParenthesizedType

export const createLiteralTypeNode = factory.createLiteralTypeNode
export const createNull = factory.createNull
export const createIdentifier = factory.createIdentifier

export const createOptionalTypeNode = factory.createOptionalTypeNode
export const createTupleTypeNode = factory.createTupleTypeNode
export const createRestTypeNode = factory.createRestTypeNode
export const createTrue = factory.createTrue
export const createFalse = factory.createFalse
export const createIndexedAccessTypeNode = factory.createIndexedAccessTypeNode
export const createTypeOperatorNode = factory.createTypeOperatorNode
