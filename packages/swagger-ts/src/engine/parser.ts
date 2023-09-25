/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import type { Head, Head2, ParserError, TailBy } from './utils.ts'
import type { IsToken, ASTs, ASTTypes } from './AST.ts'
import type { Tokenize } from './tokenizer.ts'
import type { Engine } from './index.ts'

export type Parser<
  T extends ASTs[],
  AST extends ASTs = {},
  LookBack extends ASTs = never,
  Cursor extends ASTs | [] = Head<T, ASTs>,
  LookAhead extends ASTs = Head2<T, ASTs>,
> = Cursor extends ASTs
  ? IsToken<Cursor, keyof ASTTypes> extends true
    ? IsToken<Cursor, ASTTypes['COLLON']> extends true
      ? Parser<TailBy<T, 1>, AST, Head<T>> // skip collon
      : IsToken<Cursor, ASTTypes['LINEBREAK']> extends true
      ? Parser<TailBy<T, 1>, AST, Head<T>> // skip linebreak
      : IsToken<Cursor, ASTTypes['IDENT']> extends true
      ? Parser<TailBy<T, 1>, AST & { type: 'Identifier'; value: Cursor['name'] }, Head<T>>
      : [LookAhead] extends [never]
      ? ParserError<`Unexpected end of input, expected IDENT`>
      : LookAhead extends { type: ASTTypes['IDENT'] }
      ? AST extends { type: 'Identifier' }
        ? LookBack extends { type: ASTTypes['LINEBREAK'] }
          ? {
              type: 'IdentifierRoot'
              debug: Engine['debug']['parser'] extends true
                ? {
                    Cursor: Cursor
                    LookBack: LookBack
                    LookAhead: LookAhead
                  }
                : never
              value: AST
              children: Parser<TailBy<T, 1>>
            }
          : {
              type: 'Identifier'
              debug: Engine['debug']['parser'] extends true
                ? {
                    Cursor: Cursor
                    LookBack: LookBack
                    LookAhead: LookAhead
                  }
                : never
              value: AST['value']
              children: Parser<TailBy<T, 1>> extends { value: string } ? Parser<TailBy<T, 1>>['value'] : LookAhead['name']
            }
        : AST
      : ParserError<`Expected token of type IDENT, got ${LookAhead['type']}`>
    : AST
  : AST
type Schema1 = `
Pet:
  description: test
  required: true
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
