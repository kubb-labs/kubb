/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import type { ASTMap, Identifier, ASTSwitch, ASTs } from './AST.ts'
import type { Head, Shift, Split, Join, ParserError, Trim } from './utils.ts'
import type { CombineTokens } from './AST'
import type { Engine } from './index.ts'

type ExtractIdentifier<Tokens extends string[], Token extends string = Join<Tokens, ''>> = Token extends keyof ASTMap
  ? ASTSwitch<Token>
  : Tokens extends []
  ? ParserError<`Tokens cannot be a []`>
  : Identifier<Token>

/**
 * Extract needed to get correct type => string see `Curr extends [] if`
 * Tokens are all the string getting used(included \n and \t)
 * Tokens: input
 * Acc: Result of previous loops or []
 * Cursor: Current Token
 * Res: array to track all converts(array format)
 */
type TokenizeInternal<Tokens extends string[], Acc extends string[] = [], Cursor = Head<Tokens>, Res extends ASTs[] = []> = Cursor extends []
  ? Acc extends []
    ? Res
    : [...Res, ExtractIdentifier<Acc>]
  : Cursor extends keyof ASTMap
  ? Acc['length'] extends 0
    ? // if accumulator is empty then we can just go as single tokens
      TokenizeInternal<
        Shift<Tokens>,
        [],
        Head<Shift<Tokens>>,
        [
          ...Res,
          debug: Engine['debug']['ast'] extends true
            ? ExtractIdentifier<[Cursor]> & {
                debug: {
                  Cursor: Cursor
                }
              }
            : ExtractIdentifier<[Cursor]>,
        ]
      >
    : // else extract the identifier
      TokenizeInternal<Shift<Tokens>, [], Head<Shift<Tokens>>, [...Res, ExtractIdentifier<Acc>, ASTSwitch<Cursor>]>
  : // loop back and update acc, curr
    TokenizeInternal<Shift<Tokens>, [...Acc, Extract<Cursor, string>], Head<Shift<Tokens>>, Res>

export type Tokenize<T extends string> = CombineTokens<TokenizeInternal<Split<Trim<T>, ''>>>

type Schema1 = `
Pet:
  type: object
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

type Demo1 = Tokenize<Schema1>
//    ^?

type Demo2 = Tokenize<Schema2>
//    ^?

type Demo3 = ASTSwitch<':'>
//    ^?

type Demo4 = ASTSwitch<'  '>
//    ^?
