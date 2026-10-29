import type { LiteralUnion } from '@internals/utils'

export type MemoKey = LiteralUnion<`${keyof Kubb.MemoRegistry & string}:${string}`>

export type MemoValue<TKey extends string> = TKey extends `${infer TPrefix}:${string}`
  ? TPrefix extends keyof Kubb.MemoRegistry
    ? Kubb.MemoRegistry[TPrefix]
    : unknown
  : unknown

export type Memo = <TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue) => TValue
