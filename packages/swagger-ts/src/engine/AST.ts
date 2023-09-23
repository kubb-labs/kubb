import type { ValueOf } from '@kubb/core'

import type { Indent1, Indent2, Indent3, Indent4, Indent5, Indent6, Indent7, Head, Shift } from './utils.ts'
import type { Call, Numbers } from 'hotscript'

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */

export type TokenTypes = {
  COLLON: 'COLLON' // :
  IDENT: 'IDENT' // identifer
  INDENT: 'INDENT' // \t ' '
  LINEBREAK: 'LINEBREAK' // \r \n
}

export type TokenMap = {
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

export type Identifier<T> = {
  type: TokenTypes['IDENT']
  name: T
}

export type Collon = {
  type: TokenTypes['COLLON']
}

export type Indent<Level = 1> = {
  type: TokenTypes['INDENT']
  level: Level
}

export type LineBreak<Level = 1> = {
  type: TokenTypes['LINEBREAK']
  level: Level
}

export type Tokens = ValueOf<TokenMap>

export type SwitchToken<T> = T extends keyof TokenMap ? TokenMap[T] : T

type CombineLevel<TailRes, N extends number = 1> = TailRes extends { type: TokenTypes['INDENT']; level: infer LevelIndent extends number }
  ? Indent<Call<Numbers.Add<LevelIndent, N>>>
  : TailRes extends { type: TokenTypes['LINEBREAK']; level: infer LevelLineBreak extends number }
  ? LineBreak<Call<Numbers.Add<LevelLineBreak, N>>>
  : never

type HasLevel<T> = T extends { level: number } ? true : false

export type CombineTokens<T extends Tokens[], Acc extends Tokens[] = [], Curr = Head<T>, Res extends Tokens[] = []> = Curr extends []
  ? Acc extends []
    ? Res
    : [...Res, Acc]
  : Curr extends Tokens
  ? HasLevel<Curr> extends true
    ? CombineTokens<Shift<T>, [], Head<Shift<T>>, [...Res, Extract<CombineLevel<Curr>, Tokens>]>
    : CombineTokens<Shift<T>, [], Head<Shift<T>>, [...Res, Curr]>
  : CombineTokens<Shift<T>, [...Acc, Extract<Curr, Tokens>], Head<Shift<T>>, Res>

type Demo1 = SwitchToken<' '>
//    ^?

type Demo2 = SwitchToken<'  '>
//    ^?

type Demo3 = SwitchToken<`\n`>
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
