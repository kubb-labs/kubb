/* eslint-disable @typescript-eslint/ban-types */
import type { Prettify, Comparator, Comparison } from '@kubb/core'
import type { Pipe, Call, Tuples, Strings, Objects } from 'hotscript'
import type { Trim, TrimLeft } from './utils.ts'

type CustomTypes = Record<string, string | number | Record<string, unknown>>

type Keywords = 'type' | 'required'

type IndentingOfString<S extends string, T extends string[] = []> = S extends ` ${infer R}` ? IndentingOfString<R, [...T, string]> : T['length']

type GetKeyValue<TInput extends string = ''> = TInput extends `${infer Key}:${infer Value}`
  ? { key: Trim<Key>; value: Trim<Value> }
  : { key: TInput; value: TInput }
type Test = Call<Objects.Update<'a.b', 'Hello'>, { a: { b: 1 } }>
type TestSplit = Pipe<'sdfs', [Strings.Split<'\n'>, Tuples.Map<Strings.Trim<' '>>, Tuples.ToUnion, Objects.FromEntries]>

export type Parser<
  TInput extends string = '',
  Known extends CustomTypes = {},
  Indenting extends number = 0,
  PrevKey extends string = '',
> = TInput extends `${infer Key}:${infer Value}${infer Rest}`
  ? Rest extends `${infer Schema}\n${infer RestB}`
    ? Comparator<IndentingOfString<Key>, Indenting> extends Comparison.Equal
      ? Prettify<
          Call<
            Objects.Update<
              PrevKey extends '' ? `${Trim<Key>}.${GetKeyValue<Schema>['key']}` : `${PrevKey}.${Trim<Key>}.${GetKeyValue<Schema>['key']}`,
              GetKeyValue<Schema>['value']
            >,
            Known
          > &
            Parser<RestB, Known, IndentingOfString<Key>, PrevKey extends '' ? Trim<Key> : `${PrevKey}.${Trim<Key>}`>
        >
      : Comparator<IndentingOfString<Key>, Indenting> extends Comparison.Greater
      ? Prettify<
          Call<Objects.Update<PrevKey extends '' ? `test.${Trim<Key>}` : `${PrevKey}.${Trim<Key>}`, Schema>, Known> &
            Parser<RestB, Known, IndentingOfString<Key>, PrevKey extends '' ? Trim<Key> : `${Trim<PrevKey>}.${Trim<Key>}`>
        >
      : Comparator<IndentingOfString<Key>, Indenting> extends Comparison.Lower
      ? Prettify<{
          [name in TrimLeft<Key>]: { rest: Schema; prev2: Indenting; indent: IndentingOfString<Key> }
        }>
      : Prettify<Known & { value: Schema }>
    : Known
  : Known
