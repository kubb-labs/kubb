/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import type { Head, Head2, ParserError, TailBy } from './utils.ts'
import type { IsToken, ASTs, ASTTypes } from './AST.ts'
import type { Tokenize } from './tokenizer.ts'
import type { Engine } from './index.ts'
import type { Debug } from '@kubb/core'

type ParseIdentifier<T extends ASTs[], AST extends ASTs, LookBack extends ASTs, Cursor extends ASTs, LookAhead extends ASTs> = LookAhead extends {
  type: ASTTypes['IDENT']
}
  ? AST extends { type: 'Identifier' }
    ? LookBack extends { type: ASTTypes['LINEBREAK'] }
      ? Debug<
          {
            type: 'IdentifierRoot'
            debug: {
              Cursor: Cursor
              LookBack: LookBack
              LookAhead: LookAhead
            }
            value: AST
            children: Parser<TailBy<T, 1>>
          },
          Engine['debug']['parser']
        >
      : Debug<
          {
            type: 'Identifier'
            debug: {
              Cursor: Cursor
              LookBack: LookBack
              LookAhead: LookAhead
            }
            value: AST['value']
            children: LookAhead extends { type: ASTTypes['IDENT'] }
              ? LookAhead['name']
              : Parser<TailBy<T, 1>> extends { value: string }
              ? Parser<TailBy<T, 1>>['value']
              : never
          },
          Engine['debug']['parser']
        >
    : AST
  : AST

export type Parser<
  T extends ASTs[],
  AST extends ASTs = {},
  LookBack extends ASTs = never,
  Cursor extends ASTs | [] = Head<T, ASTs>,
  LookAhead extends ASTs = Head2<T, ASTs>,
> = Cursor extends ASTs
  ? IsToken<Cursor, keyof ASTTypes> extends true
    ? // skip linebreak and collon
      IsToken<Cursor, ASTTypes['LINEBREAK' | 'COLLON']> extends true
      ? Parser<TailBy<T, 1>, AST, Head<T>>
      : IsToken<Cursor, ASTTypes['IDENT']> extends true
      ? Parser<TailBy<T, 1>, AST & { type: 'Identifier'; value: Cursor['name'] }, Head<T>>
      : [LookAhead] extends [never]
      ? ParserError<`Unexpected end of input, expected IDENT`>
      : ParseIdentifier<T, AST, LookBack, Cursor, LookAhead>
    : ParserError<`Expected token of type IDENT, got ${LookAhead['type']}`>
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
