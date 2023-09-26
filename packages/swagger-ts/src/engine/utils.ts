/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import type { Whitespace, Primitive } from '@kubb/core'

declare const ErrorBrand: unique symbol
export type ParserError<T extends string> = T & { __brand: typeof ErrorBrand }

type InternalHasErrors<T, Else> = T extends ParserError<string> ? T : Else

export type HasErrors<T> = InternalHasErrors<T, []> extends [] ? false : true

export type TrimLeft<V extends string> = V extends `${Whitespace}${infer R}` ? TrimLeft<R> : V

export type TrimRight<V extends string> = V extends `${infer R}${Whitespace}` ? TrimRight<R> : V

export type Trim<V extends string> = TrimLeft<TrimRight<V>>

export type Head<TInput extends unknown[]> = TInput extends [infer H, ...infer _T] ? H : []

export type Head2<TInput extends unknown[]> = TInput extends [infer H1, infer H2, ...infer _P] ? H2 : []
export type Pop<T extends unknown[]> = T extends [...infer H, infer _T] ? H : []

export type Tail<T extends unknown[]> = T extends [...infer _H, infer T] ? T : []

export type Shift<T extends unknown[]> = T extends [infer _H, ...infer T] ? T : []
export type Push<T extends unknown[], V = 0> = [...T, V]

export type TailBy<T extends unknown[], By extends number, A extends number[] = []> = By extends A['length'] ? T : TailBy<Shift<T>, By, Push<A>>

export type Filter<T extends unknown[], P> = T extends [infer F, ...infer R] ? (F extends P ? [F, ...Filter<R, P>] : Filter<R, P>) : never

type Indents = {
  0: ''
  1: ' '
  2: '  '
  3: '   '
  4: '    '
  5: '     '
  6: '      '
  7: '       '
}

export type Indent<T, Level = 1> = Level extends keyof Indents ? `${Indents[Level]}${T & string}` : `${Indents[7]}${T & string}`

export declare const Indent1: Indent<'', 1>
export declare const Indent2: Indent<'', 2>
export declare const Indent3: Indent<'', 3>
export declare const Indent4: Indent<'', 4>
export declare const Indent5: Indent<'', 5>
export declare const Indent6: Indent<'', 6>
export declare const Indent7: Indent<'', 7>

export type Split<Str extends string, SplitBy extends string, Acc extends string[] = []> = Str extends ''
  ? Acc
  : Str extends `${infer P1}${SplitBy}${infer P2}`
  ? Split<P2, SplitBy, [...Acc, P1]>
  : [...Acc, Str]

export type Join<T extends unknown[], D extends string, Acc extends string = ''> = T extends []
  ? ''
  : T extends [Primitive]
  ? `${Acc}${T[0]}`
  : T extends [Primitive, ...infer U]
  ? Join<U, D, `${Acc}${T[0]}${D}`>
  : string

export type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof A & keyof B ? A[K] | B[K] : K extends keyof B ? B[K] : K extends keyof A ? A[K] : never
}
