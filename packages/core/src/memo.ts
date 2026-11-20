import { type LiteralUnion, memo as storeMemo } from '@internals/utils'

export type MemoKey = LiteralUnion<`${keyof Kubb.MemoRegistry & string}:${string}`>

export type MemoValue<TKey extends string> = TKey extends `${infer TPrefix}:${string}`
  ? TPrefix extends keyof Kubb.MemoRegistry
    ? Kubb.MemoRegistry[TPrefix]
    : unknown
  : unknown

/**
 * The build memo. Call it to compute a value once, or use `get`, `set` and `has` to read and
 * replace a value directly.
 */
export type Memo = (<TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue) => TValue) & {
  get<TKey extends MemoKey>(key: TKey): MemoValue<TKey> | undefined
  set<TKey extends MemoKey>(key: TKey, value: MemoValue<TKey>): void
  has(key: MemoKey): boolean
}

export function createMemo(store: Map<string, unknown> = new Map()): Memo {
  return Object.assign((key: string, compute: () => unknown) => storeMemo(store, key, compute), {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => {
      store.set(key, value)
    },
    has: (key: string) => store.has(key),
  }) as Memo
}
