import type { TypeIndexSignature, TypeIRNode, TypeMember, TypeTupleNode } from '@kubb/ast'
import ts from 'typescript'

const { SyntaxKind, factory } = ts

/**
 * Reports whether `str` is a valid TypeScript identifier, so object keys that are not get quoted.
 * Mirrors `ts.isIdentifierText`, which is absent from the public type declarations.
 */
function isValidIdentifier(str: string): boolean {
  if (!str.length || str.trim() !== str) {
    return false
  }

  let ch = str.codePointAt(0)!
  if (!ts.isIdentifierStart(ch, ts.ScriptTarget.Latest)) {
    return false
  }
  for (let i = ch > 0xffff ? 2 : 1; i < str.length; i += ch > 0xffff ? 2 : 1) {
    ch = str.codePointAt(i)!
    if (!ts.isIdentifierPart(ch, ts.ScriptTarget.Latest)) {
      return false
    }
  }
  return true
}

/**
 * Builds a property-name node, quoting it as a string literal when it is not a valid identifier.
 */
function propertyName(name: string): ts.PropertyName {
  return isValidIdentifier(name) ? factory.createIdentifier(name) : factory.createStringLiteral(name)
}

const questionToken = factory.createToken(ts.SyntaxKind.QuestionToken)

/**
 * Resolves an optional `?` token, reusing the cached token when `true` is passed.
 */
function createQuestionToken(token?: boolean | ts.QuestionToken): ts.QuestionToken | undefined {
  if (!token) {
    return undefined
  }
  if (token === true) {
    return questionToken
  }
  return token
}

/**
 * Pre-built TypeScript keyword type nodes. `integer` reuses the `number` keyword and `null` is a
 * literal type node, matching the existing printer tables.
 */
export const keywordTypeNodes = {
  any: factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  unknown: factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
  void: factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  number: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  integer: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  bigint: factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword),
  object: factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
  string: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  boolean: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
  undefined: factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
  null: factory.createLiteralTypeNode(factory.createToken(ts.SyntaxKind.NullKeyword)),
  never: factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
} as const

/**
 * Builds an intersection type node, collapsing a single member and optionally wrapping the result
 * in parentheses. Returns `null` for an empty member list.
 */
function createIntersectionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode | null {
  if (!nodes.length) {
    return null
  }
  if (nodes.length === 1) {
    return nodes[0] || null
  }

  const node = factory.createIntersectionTypeNode(nodes)
  return withParentheses ? factory.createParenthesizedType(node) : node
}

/**
 * Builds an array type node, using `T[]` for `'array'` and `Array<T>` for `'generic'`. Multiple
 * nodes form a union element, parenthesized for the bracket form.
 */
function createArrayDeclaration({ nodes, arrayType = 'array' }: { nodes: Array<ts.TypeNode>; arrayType?: 'array' | 'generic' }): ts.TypeNode | null {
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

  const unionType = factory.createUnionTypeNode(nodes)
  if (arrayType === 'generic') {
    return factory.createTypeReferenceNode(factory.createIdentifier('Array'), [unionType])
  }
  return factory.createArrayTypeNode(factory.createParenthesizedType(unionType))
}

/**
 * Builds a union type node, collapsing a single member and optionally wrapping the result in
 * parentheses. Falls back to `any` for an empty member list.
 */
function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode {
  if (!nodes.length) {
    return keywordTypeNodes.any
  }
  if (nodes.length === 1) {
    return nodes[0] as ts.TypeNode
  }

  const node = factory.createUnionTypeNode(nodes)
  return withParentheses ? factory.createParenthesizedType(node) : node
}

/**
 * Builds a property signature with optional `readonly` and `?` markers.
 */
function createPropertySignature({
  readOnly,
  name,
  questionToken,
  type,
}: {
  readOnly?: boolean
  name: string
  questionToken?: ts.QuestionToken | boolean
  type?: ts.TypeNode
}): ts.PropertySignature {
  return factory.createPropertySignature(
    readOnly ? [factory.createToken(ts.SyntaxKind.ReadonlyKeyword)] : undefined,
    propertyName(name),
    createQuestionToken(questionToken),
    type,
  )
}

/**
 * Builds a function parameter declaration, used for the key parameter of an index signature.
 */
function createParameterSignature(name: string, { type }: { type?: ts.TypeNode }): ts.ParameterDeclaration {
  return factory.createParameterDeclaration(undefined, undefined, name, undefined, type, undefined)
}

/**
 * Attaches JSDoc comments to a node as a synthetic leading comment, returning the node unchanged
 * when there is nothing to attach.
 *
 * @see https://github.com/microsoft/TypeScript/issues/44151
 */
function appendJSDocToNode<TNode extends ts.Node>({ node, comments }: { node: TNode; comments: Array<string | undefined> }): TNode {
  const filteredComments = comments.filter(Boolean)
  if (!filteredComments.length) {
    return node
  }

  const text = filteredComments.reduce((acc = '', comment = '') => {
    return `${acc}\n * ${comment.replaceAll('*/', '*\\/')}`
  }, '*')

  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, `${text || '*'}\n`, true)
}

/**
 * Builds an index signature, defaulting the key to `[key: string]`.
 */
function createIndexSignature(
  type: ts.TypeNode,
  { indexName = 'key', indexType = factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) }: { indexName?: string; indexType?: ts.TypeNode } = {},
): ts.IndexSignatureDeclaration {
  return factory.createIndexSignature(undefined, [createParameterSignature(indexName, { type: indexType })], type)
}

/**
 * Builds an `Omit<T, Keys>` type node, optionally wrapping `T` in `NonNullable<T>` first.
 */
function createOmitDeclaration({ keys, type, nonNullable }: { keys: Array<string> | string; type: ts.TypeNode; nonNullable?: boolean }): ts.TypeNode {
  const node = nonNullable ? factory.createTypeReferenceNode(factory.createIdentifier('NonNullable'), [type]) : type

  if (Array.isArray(keys)) {
    return factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [
      node,
      factory.createUnionTypeNode(keys.map((key) => factory.createLiteralTypeNode(factory.createStringLiteral(key)))),
    ])
  }

  return factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [node, factory.createLiteralTypeNode(factory.createStringLiteral(keys))])
}

/**
 * Converts an OAS-style path (`/pets/{petId}`) or Express-style path (`/pets/:petId`) to a
 * template literal type like `` `/pets/${string}` ``.
 */
function createUrlTemplateType(path: string): ts.TypeNode {
  const normalized = path.replace(/:([^/]+)/g, '{$1}')

  if (!normalized.includes('{')) {
    return factory.createLiteralTypeNode(factory.createStringLiteral(normalized))
  }

  const segments = normalized.split(/(\{[^}]+\})/)
  const parts: Array<string> = []
  const parameterIndices: Array<number> = []

  segments.forEach((segment) => {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      parameterIndices.push(parts.length)
      parts.push(segment)
    } else if (segment) {
      parts.push(segment)
    }
  })

  const head = factory.createTemplateHead(parts[0] || '')
  const templateSpans: Array<ts.TemplateLiteralTypeSpan> = []

  parameterIndices.forEach((paramIndex, i) => {
    const isLast = i === parameterIndices.length - 1
    const nextPart = parts[paramIndex + 1] || ''
    const literal = isLast ? factory.createTemplateTail(nextPart) : factory.createTemplateMiddle(nextPart)
    templateSpans.push(factory.createTemplateLiteralTypeSpan(keywordTypeNodes.string, literal))
  })

  return factory.createTemplateLiteralType(head, templateSpans)
}

/**
 * Converts a primitive value to a literal type node, handling negative numbers via a prefix unary
 * expression.
 */
function constToTypeNode(value: string | number | boolean, format: 'string' | 'number' | 'boolean'): ts.TypeNode {
  if (format === 'boolean') {
    return factory.createLiteralTypeNode(value === true ? factory.createTrue() : factory.createFalse())
  }
  if (format === 'number' && typeof value === 'number') {
    if (value < 0) {
      return factory.createLiteralTypeNode(factory.createPrefixUnaryExpression(SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(value))))
    }
    return factory.createLiteralTypeNode(factory.createNumericLiteral(value))
  }
  return factory.createLiteralTypeNode(factory.createStringLiteral(String(value)))
}

/**
 * Builds a tuple type node from already-converted item nodes, applying the `min`/`max` slice and
 * the optional and rest element rules.
 */
function tupleToNode(node: TypeTupleNode): ts.TypeNode {
  let items = node.items.map(typeIRToNode)
  const restNode = node.rest ? typeIRToNode(node.rest) : undefined
  const { min, max } = node

  if (max !== undefined) {
    items = items.slice(0, max)
    if (items.length < max && restNode) {
      items = [...items, ...Array(max - items.length).fill(restNode)]
    }
  }

  if (min !== undefined) {
    items = items.map((item, i) => (i >= min ? factory.createOptionalTypeNode(item) : item))
  }

  if (max === undefined && restNode) {
    items.push(factory.createRestTypeNode(factory.createArrayTypeNode(restNode)))
  }

  return factory.createTupleTypeNode(items)
}

/**
 * Converts a {@link TypeMember} to a property signature, attaching any JSDoc.
 */
function memberToSignature(member: TypeMember): ts.TypeElement {
  const signature = createPropertySignature({
    name: member.name,
    type: typeIRToNode(member.type),
    questionToken: member.optional,
    readOnly: member.readOnly,
  })

  return appendJSDocToNode({ node: signature, comments: member.jsDoc ?? [] })
}

/**
 * Converts a {@link TypeIndexSignature} to an index signature declaration.
 */
function indexToSignature(signature: TypeIndexSignature): ts.TypeElement {
  return createIndexSignature(typeIRToNode(signature.type), {
    indexName: signature.keyName,
    indexType: signature.keyType ? typeIRToNode(signature.keyType) : undefined,
  })
}

/**
 * Converts a {@link TypeIRNode} to a TypeScript compiler type node. The TypeScript printer then
 * serializes the result, so output matches the previous `ts.factory`-based printer byte for byte.
 */
export function typeIRToNode(node: TypeIRNode): ts.TypeNode {
  switch (node.kind) {
    case 'TypeKeyword':
      return keywordTypeNodes[node.keyword]
    case 'TypeReference':
      return factory.createTypeReferenceNode(node.name, node.typeArgs?.map(typeIRToNode))
    case 'TypeLiteralType':
      return constToTypeNode(node.value, node.format)
    case 'TypeArray':
      return createArrayDeclaration({ nodes: node.elements.map(typeIRToNode), arrayType: node.arrayType }) ?? keywordTypeNodes.never
    case 'TypeUnion':
      return createUnionDeclaration({ nodes: node.members.map(typeIRToNode), withParentheses: node.withParentheses })
    case 'TypeIntersection':
      return createIntersectionDeclaration({ nodes: node.members.map(typeIRToNode), withParentheses: node.withParentheses }) ?? keywordTypeNodes.never
    case 'TypeTuple':
      return tupleToNode(node)
    case 'TypeObject':
      return factory.createTypeLiteralNode([...node.members.map(memberToSignature), ...(node.indexSignatures ?? []).map(indexToSignature)])
    case 'TypeUrlTemplate':
      return createUrlTemplateType(node.path)
    case 'TypeOmit':
      return createOmitDeclaration({ keys: node.keys, type: typeIRToNode(node.type), nonNullable: node.nonNullable })
    default:
      return keywordTypeNodes.never
  }
}
