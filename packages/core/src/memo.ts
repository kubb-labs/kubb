import type { LiteralUnion } from '@internals/utils'

/**
 * A memo key: a prefix registered in `Kubb.MemoRegistry`, a colon, and what makes the entry unique.
 * Any other string is accepted too, and stores `unknown`.
 */
export type MemoKey = LiteralUnion<`${keyof Kubb.MemoRegistry & string}:${string}`>

/**
 * The value stored under `TKey`: what its prefix registers in `Kubb.MemoRegistry`, or `unknown`.
 */
export type MemoValue<TKey extends string> = TKey extends `${infer TPrefix}:${string}`
  ? TPrefix extends keyof Kubb.MemoRegistry
    ? Kubb.MemoRegistry[TPrefix]
    : unknown
  : unknown

/**
 * Returns what `compute` produced the first time this build asked for `key`, and skips `compute` after that.
 *
 * @example
 * `memo(`name:${name}`, () => pascalCase(name))`
 */
export type Memo = <TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue) => TValue

export function memoize<TKey extends MemoKey, TValue extends MemoValue<TKey>>(store: Map<string, unknown>, key: TKey, compute: () => TValue): TValue {
  if (store.has(key)) return store.get(key) as TValue
  const value = compute()
  store.set(key, value)
  return value
}
