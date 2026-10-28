import type { LiteralUnion } from '@internals/utils'

export type MemoKey = LiteralUnion<`${keyof Kubb.MemoRegistry & string}:${string}`>

export type MemoValue<TKey extends string> = TKey extends `${infer TPrefix}:${string}`
  ? TPrefix extends keyof Kubb.MemoRegistry
    ? Kubb.MemoRegistry[TPrefix]
    : unknown
  : unknown

export type Memo = <TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue) => TValue

export function memoize<TKey extends MemoKey, TValue extends MemoValue<TKey>>(store: Map<string, unknown>, key: TKey, compute: () => TValue): TValue {
  if (store.has(key)) return store.get(key) as TValue
  const value = compute()
  store.set(key, value)
  return value
}
