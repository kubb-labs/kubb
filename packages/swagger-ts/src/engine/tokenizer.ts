/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import type { ASTMap, Identifier, ASTSwitch } from './AST.ts'
import type { Head, Shift, Split, Join, ParserError, Trim } from './utils.ts'
import type { CombineTokens } from './AST'
import type { Engine } from './index.ts'

type ExtractIdentifier<Acc extends string[], Token extends string = Join<Acc, ''>> = Token extends keyof ASTMap
  ? ASTSwitch<Token>
  : Acc extends []
  ? ParserError<`Acc cannot be a []`>
  : Identifier<Token>

/**
 * Extract needed to get correct type => string see `Curr extends [] if`
 * Tokens are all the string getting used(included \n and \t)
 */
type TokenizeInternal<Tokens extends string[], Acc extends string[] = [], Curr = Head<Tokens>, Res extends any[] = []> = Curr extends []
  ? Acc extends []
    ? Res
    : [...Res, ExtractIdentifier<Acc>]
  : Curr extends keyof ASTMap
  ? Acc['length'] extends 0
    ? // if accumulator is empty then we can just go as single tokens
      TokenizeInternal<
        Shift<Tokens>,
        [],
        Head<Shift<Tokens>>,
        [
          ...Res,
          debug: Engine['debug']['ast'] extends true
            ? ExtractIdentifier<[Curr]> & {
                debug: {
                  Cursor: Curr
                }
              }
            : ExtractIdentifier<[Curr]>,
        ]
      >
    : // else extract the identifier
      TokenizeInternal<Shift<Tokens>, [], Head<Shift<Tokens>>, [...Res, ExtractIdentifier<Acc>, ASTSwitch<Curr>]>
  : // loop back and update acc, curr
    TokenizeInternal<Shift<Tokens>, [...Acc, Extract<Curr, string>], Head<Shift<Tokens>>, Res>

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
