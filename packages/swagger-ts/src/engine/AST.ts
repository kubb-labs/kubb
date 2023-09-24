import type { ValueOf } from '@kubb/core'

import type { Indent1, Indent2, Indent3, Indent4, Indent5, Indent6, Indent7, Head, Shift, Tail, Pop } from './utils.ts'
import type { Call, Numbers } from 'hotscript'

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */

export type ASTTypes = {
  COLLON: 'COLLON' // :
  IDENT: 'IDENT' // identifer
  INDENT: 'INDENT' // \t ' '
  LINEBREAK: 'LINEBREAK' // \r \n
}

export type ASTMap = {
  ':': Collon
  '\r': LineBreak<1>
  '\r ': LineBreak<2>
  '\n': LineBreak<1>
  '\n ': LineBreak<2>
  [Indent7]: Indent<7>
  [Indent6]: Indent<6>
  [Indent5]: Indent<5>
  [Indent4]: Indent<4>
  [Indent3]: Indent<3>
  [Indent2]: Indent<2>
  [Indent1]: Indent<1>
}

export type Identifier<TName extends string> = {
  type: ASTTypes['IDENT']
  name: TName
}

export type Collon = {
  type: ASTTypes['COLLON']
}

export type Indent<Level = 1> = {
  type: ASTTypes['INDENT']
  level: Level
}

export type LineBreak<Level = 1> = {
  type: ASTTypes['LINEBREAK']
  level: Level
}

export type ASTs = ValueOf<ASTMap> | Identifier<any>

export type ASTSwitch<T> = T extends keyof ASTMap ? ASTMap[T] : T

type CombineLevel<Token, N extends number = 1> = Token extends { type: ASTTypes['INDENT']; level: infer LevelIndent extends number }
  ? Indent<Call<Numbers.Add<LevelIndent, N>>>
  : Token extends { type: ASTTypes['LINEBREAK']; level: infer LevelLineBreak extends number }
  ? LineBreak<Call<Numbers.Add<LevelLineBreak, N>>>
  : never

type HasLevel<T> = T extends { level: number } ? true : false
/**
 * Tokens extends any[] should be Tokens extends ASTs[]
 */
export type CombineTokens<Tokens extends any[], Acc extends ASTs[] = [], Curr = Head<Tokens>, Res extends any[] = []> = Curr extends []
  ? Acc extends []
    ? Res
    : [...Res, Acc]
  : Curr extends ASTs
  ? Curr extends { level: number }
    ? CombineTokens<
        Shift<Tokens>,
        [],
        Head<Shift<Tokens>>,
        Tail<Res> extends { level: number; type: Curr['type'] }
          ? [...Pop<Res>, Extract<CombineLevel<Curr, Tail<Res>['level']>, ASTs>]
          : [...Res, Extract<Curr, ASTs>]
      >
    : // all Tokens that does not have `level`
      CombineTokens<Shift<Tokens>, [], Head<Shift<Tokens>>, [...Res, Curr]>
  : CombineTokens<Shift<Tokens>, [...Acc, Extract<Curr, ASTs>], Head<Shift<Tokens>>, Res>

type Demo1 = ASTSwitch<' '>
//    ^?

type Demo2 = ASTSwitch<'  '>
//    ^?

type Demo3 = ASTSwitch<`\n`>
//    ^?

type Demo4 = [CombineLevel<Indent<1>>, CombineLevel<LineBreak<1>>, CombineLevel<Indent<2>>, CombineLevel<Indent<3>>]
//    ^?

type Demo5 = CombineTokens<[Indent<1>, Indent<1>, LineBreak<1>, LineBreak<1>, Collon]>
//    ^?

type Demo6 = CombineTokens<[Indent<1>, Indent<1>, Indent<1>, LineBreak<1>, Collon]>
//    ^?

type Demo7 = CombineTokens<[Indent<2>, Indent<2>, Collon]>
//    ^?

type Demo8 = [HasLevel<LineBreak<1>>, HasLevel<Collon>]
//    ^?
