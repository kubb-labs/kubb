/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import type { Head, Head2, ParserError, TailBy } from './utils.ts'
import type { IsToken, ASTs, ASTTypes } from './AST.ts'
import type { Tokenize } from './tokenizer.ts'
export type Parser<T extends ASTs[], AST = {}, Cursor extends ASTs | [] = Head<T, ASTs>, LookAhead extends ASTs = Head2<T, ASTs>> = Cursor extends ASTs
  ? IsToken<Cursor, keyof ASTTypes> extends true
    ? IsToken<Cursor, ASTTypes['COLLON']> extends true
      ? Parser<TailBy<T, 1>, AST> // skip collon
      : IsToken<Cursor, ASTTypes['IDENT']> extends true
      ? Parser<TailBy<T, 1>, AST & { type: 'Identifier'; value: Cursor['name'] }>
      : [LookAhead] extends [never]
      ? ParserError<`Unexpected end of input, expected IDENT`>
      : LookAhead extends { type: ASTTypes['IDENT'] }
      ? {
          // debug: {
          //   LookAhead: LookAhead
          // }
          value: AST
          children: Parser<TailBy<T, 1>>
        }
      : ParserError<`Expected token of type IDENT, got ${LookAhead['type']}`>
    : AST
  : AST
type Schema1 = `
type: object
`

type Schema2 = `
Pet:
  type: object
  description: test
  required: true
Tag:
  type: object
  properties:
    id:
      type: integer
      format: int64
    name:
      type: string
`
type Token1 = Tokenize<Schema1>
//    ^?
type Demo1 = Parser<Token1>
//    ^?

type Demo2 = Parser<Tokenize<Schema2>>
//    ^?
