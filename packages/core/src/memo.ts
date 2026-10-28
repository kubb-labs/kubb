import type { LiteralUnion } from '@internals/utils'

/** A registered prefix, a colon, and what makes the entry unique. Any other string stores `unknown`. */
export type MemoKey = LiteralUnion<`${keyof Kubb.MemoRegistry & string}:${string}`>

/** The type `Kubb.MemoRegistry` registers for the prefix of `TKey`, or `unknown`. */
export type MemoValue<TKey extends string> = TKey extends `${infer TPrefix}:${string}`
  ? TPrefix extends keyof Kubb.MemoRegistry
    ? Kubb.MemoRegistry[TPrefix]
    : unknown
  : unknown

/** Returns what `compute` produced the first time this build asked for `key`. */
export type Memo = <TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue) => TValue

export function memoize<TKey extends MemoKey, TValue extends MemoValue<TKey>>(store: Map<string, unknown>, key: TKey, compute: () => TValue): TValue {
  if (store.has(key)) return store.get(key) as TValue
  const value = compute()
  store.set(key, value)
  return value
}
