import { memo as coreMemo, type Memo } from '@kubb/core'

type RegistryKey = keyof Kubb.MemoRegistry & string

type SlotsOf<TName extends string> = { [TKey in RegistryKey]: TKey extends `${TName}:${infer TSlot}` ? TSlot : never }[RegistryKey]

type ScopedKey<TName extends string> = SlotsOf<TName> | `${SlotsOf<TName>}:${string}`

type ScopedValue<TName extends string, TKey extends string> = {
  [TSlot in SlotsOf<TName>]: TKey extends TSlot | `${TSlot}:${string}` ? Kubb.MemoRegistry[`${TName}:${TSlot}` & RegistryKey] : never
}[SlotsOf<TName>]

/**
 * A build memo whose keys all start with a plugin's name. Returned by `memo.scope`.
 */
export type ScopedMemo<TName extends string> = <TKey extends ScopedKey<TName>>(key: TKey, compute: () => ScopedValue<TName, TKey>) => ScopedValue<TName, TKey>

function scope<TName extends string>(ctx: { memo: Memo }, name: TName): ScopedMemo<TName> {
  return ((key: string, compute: () => unknown) =>
    (ctx.memo as (key: string, compute: () => unknown) => unknown)(`${name}:${key}`, compute)) as ScopedMemo<TName>
}

/**
 * Core's `memo`, plus `memo.scope(ctx, name)`: the build memo with `name:` in front of every key,
 * typed by the full keys in `Kubb.MemoRegistry`, such as `'plugin-zod:printer'`.
 */
export const memo: typeof coreMemo & { scope: typeof scope } = Object.assign(
  (...args: Parameters<typeof coreMemo>) => (coreMemo as (...args: Array<unknown>) => unknown)(...args),
  { create: coreMemo.create, scope },
) as typeof coreMemo & { scope: typeof scope }
