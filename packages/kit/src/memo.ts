import { memo as coreMemo, type Memo } from '@kubb/core'

type RegistryKey = keyof Kubb.MemoRegistry & string

/**
 * Slots registered under `TName:` in `Kubb.MemoRegistry`, without the prefix.
 */
type SlotsOf<TName extends string> = { [TKey in RegistryKey]: TKey extends `${TName}:${infer TSlot}` ? TSlot : never }[RegistryKey]

/**
 * A key a scoped memo accepts: a slot, or a slot followed by `:` and any rest.
 */
type ScopedKey<TName extends string> = SlotsOf<TName> | `${SlotsOf<TName>}:${string}`

/**
 * The value type registered for the slot that `TKey` starts with.
 */
type ScopedValue<TName extends string, TKey extends string> = {
  [TSlot in SlotsOf<TName>]: TKey extends TSlot | `${TSlot}:${string}` ? Kubb.MemoRegistry[`${TName}:${TSlot}` & RegistryKey] : never
}[SlotsOf<TName>]

/**
 * A build memo whose keys all start with a plugin's name. Returned by `memo.scope`.
 */
export type ScopedMemo<TName extends string> = <TKey extends ScopedKey<TName>>(key: TKey, compute: () => ScopedValue<TName, TKey>) => ScopedValue<TName, TKey>

/**
 * Returns the build memo of `ctx` with `name:` in front of every key.
 *
 * Register each slot with its full key in `Kubb.MemoRegistry`, such as `'plugin-zod:printer'`. The
 * scoped memo then offers only the slots that start with `name:`, and types each value. Pass the
 * plugin's name constant, because `ctx.plugin.name` is typed as a plain `string`.
 *
 * @example
 * ```ts
 * const zodMemo = memo.scope(ctx, pluginZodName)
 * const printer = zodMemo(`printer:${mode}`, () => createPrinter(ctx)) // key plugin-zod:printer:…
 * ```
 */
function scope<TName extends string>(ctx: { memo: Memo }, name: TName): ScopedMemo<TName> {
  return ((key: string, compute: () => unknown) =>
    (ctx.memo as (key: string, compute: () => unknown) => unknown)(`${name}:${key}`, compute)) as ScopedMemo<TName>
}

/**
 * Returns a value computed once per build and shared by every plugin, or caches it in a store you
 * pass first. `memo.create` makes such a store, and `memo.scope` adds a plugin prefix to every key.
 *
 * @example Once per build
 * `const names = memo('myPlugin:names', () => collectNames(schemas))`
 *
 * @example In your own store
 * ```ts
 * const cache = memo.create<ast.SchemaNode, Array<string>>({ weak: true })
 * const refs = memo(cache, node, () => collectRefs(node))
 * ```
 */
export const memo: typeof coreMemo & { scope: typeof scope } = Object.assign(
  (...args: Parameters<typeof coreMemo>) => (coreMemo as (...args: Array<unknown>) => unknown)(...args),
  { create: coreMemo.create, scope },
) as typeof coreMemo & { scope: typeof scope }
