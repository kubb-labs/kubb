import { type LiteralUnion, memo as storeMemo } from '@internals/utils'

export type MemoKey = LiteralUnion<`${keyof Kubb.MemoRegistry & string}:${string}`>

export type FullKey = keyof Kubb.MemoRegistry & `${string}:${string}`

export type FullKeyValue<TKey extends string> = {
  [TFull in FullKey]: TKey extends TFull | `${TFull}:${string}` ? Kubb.MemoRegistry[TFull] : never
}[FullKey]

// A full-key slot such as 'plugin-zod:printer' wins over a prefix-only one such as 'name'. The outer
// conditional distributes over a key union, so each member picks its own lookup.
export type MemoValue<TKey extends string> = TKey extends string
  ? [FullKeyValue<TKey>] extends [never]
    ? TKey extends `${infer TPrefix}:${string}`
      ? TPrefix extends keyof Kubb.MemoRegistry
        ? Kubb.MemoRegistry[TPrefix]
        : unknown
      : unknown
    : FullKeyValue<TKey>
  : never

/**
 * The build memo. Call it to compute a value once, or use `get`, `set` and `has` to read and
 * replace a value directly.
 */
export type Memo = (<TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue) => TValue) & {
  get<TKey extends MemoKey>(key: TKey): MemoValue<TKey> | undefined
  set<TKey extends MemoKey>(key: TKey, value: MemoValue<TKey>): void
  has(key: MemoKey): boolean
}

export function createMemo(store: Map<string, unknown>): Memo {
  return Object.assign((key: string, compute: () => unknown) => storeMemo(store, key, compute), {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => {
      store.set(key, value)
    },
    has: (key: string) => store.has(key),
  }) as Memo
}
