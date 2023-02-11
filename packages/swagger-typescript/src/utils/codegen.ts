import ts, { factory } from 'typescript'

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

export const modifier = {
  async: factory.createModifier(ts.SyntaxKind.AsyncKeyword),
  export: factory.createModifier(ts.SyntaxKind.ExportKeyword),
} as const

export function isValidIdentifier(str: string) {
  if (!str.length || str.trim() !== str) return false
  const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest)
  return !!node && node.kind === ts.SyntaxKind.Identifier && node.originalKeywordKind === undefined
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
    indexType = keywordTypeNodes.string,
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
/* TODO add import default and use that to replace(in OperationGenerator):
 import { useQuery } from "@tanstack/react-query";
          import axios from "axios";
          import { parseTemplate } from 'url-template';

*/
export function createImportDeclaration({ propertyNames, path }: { propertyNames: Array<ts.Identifier | string>; path: string }) {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      true,
      undefined,
      factory.createNamedImports(
        propertyNames.map((propertyName) => {
          return factory.createImportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
        })
      )
    ),
    factory.createStringLiteral(path),
    undefined
  )
}

export function createExportDeclaration({ path }: { path: string }) {
  return factory.createExportDeclaration(undefined, false, undefined, factory.createStringLiteral(path), undefined)
}
