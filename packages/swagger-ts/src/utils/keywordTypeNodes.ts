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
