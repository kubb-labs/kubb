import { AsyncLocalStorage } from 'node:async_hooks'
import { memo as storeMemo } from '@internals/utils'
import type { UserFileNode } from '@kubb/ast'
import type { KubbPluginSetupContext, NormalizedPlugin, PluginType, PluginName, PluginVisitContext, ResolvePluginOptions } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Memo, MemoKey, MemoValue } from './memo.ts'
import type { Config } from './types.ts'

const kubbContextKey = Symbol.for('kubb.context')

/**
 * A context the `kubbContext` store can hold: the setup context in `setup` and `kubb:plugin:setup`,
 * or the plugin visit context in the other hooks.
 */
export type KubbContext = KubbPluginSetupContext | PluginVisitContext

type KubbContextHost = typeof globalThis & { [kubbContextKey]?: AsyncLocalStorage<KubbContext> }

const host = globalThis as KubbContextHost

/**
 * Holds the context of the plugin hook that is running. {@link withContext} sets it.
 *
 * The store lives on `globalThis`, so the ESM and CommonJS builds of `@kubb/core` share one. A plugin that a
 * CommonJS config loads would otherwise read an empty store and fail with `KUBB_NO_CONTEXT`.
 */
export const kubbContext: AsyncLocalStorage<KubbContext> = (host[kubbContextKey] ??= new AsyncLocalStorage<KubbContext>())

/**
 * Runs `fn` with `ctx` as its `this`, its argument and the store `useKubb()` reads, also after an `await` in `fn`.
 *
 * @example
 * `await withContext(ctx, async function () { await plugin.setup.call(this, this.options, this) })`
 */
export function withContext<TContext extends object, TResult>(ctx: TContext, fn: (this: TContext, ctx: TContext) => TResult): TResult {
  return kubbContext.run(ctx as unknown as KubbContext, () => fn.call(ctx, ctx))
}

function requireContext(caller: string): KubbContext {
  const ctx = kubbContext.getStore()
  if (ctx) return ctx

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    message: `\`${caller}()\` was called outside a plugin setup.`,
    help: `Call \`${caller}()\` inside \`setup\` or \`kubb:plugin:setup\`, including in code that setup awaits.`,
  })
}

// A setup context is the only one with `setOptions`.
function requireSetupContext(caller: string): KubbPluginSetupContext {
  const ctx = requireContext(caller)
  if ('setOptions' in ctx) return ctx

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    plugin: ctx.plugin.name,
    message: `\`${caller}()\` runs only in \`setup\` or \`kubb:plugin:setup\`.`,
    help: `Call \`${caller}()\` inside \`setup\` or \`kubb:plugin:setup\`, including in code that setup awaits.`,
  })
}

/**
 * Returns the context of the running hook, the same object as its `this` and `ctx`, for every hook core
 * runs through `withContext`. It stays available after an `await`. Throws `KUBB_NO_CONTEXT` when no
 * context is set.
 *
 * Pass the context type to read hook-specific fields, such as `useKubb<PluginVisitContext>()`.
 */
export function useKubb<TContext extends KubbContext = KubbPluginSetupContext>(): TContext {
  return requireContext('useKubb') as TContext
}

/**
 * Returns the same context as {@link useKubb}, or `undefined` outside a plugin hook.
 */
export function tryUseKubb<TContext extends KubbContext = KubbPluginSetupContext>(): TContext | undefined {
  return kubbContext.getStore() as TContext | undefined
}

/**
 * Adds a raw file to the build output, like `ctx.injectFile`. Runs only in `setup` and `kubb:plugin:setup`.
 */
export function injectFile(file: UserFileNode): void {
  requireSetupContext('injectFile').injectFile(file)
}

/**
 * Returns a value computed once per build and shared by every plugin, like `ctx.memo`.
 *
 * Pass a store first to cache in it instead, with no build needed: a `Map` or `WeakMap`, or one
 * from `memo.create`.
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
export const memo: Memo & typeof storeMemo = Object.assign(
  (...args: [string, () => unknown] | Parameters<typeof storeMemo>) =>
    args.length === 3 ? storeMemo(...args) : (requireContext('memo').memo as (key: string, compute: () => unknown) => unknown)(...args),
  {
    create: storeMemo.create,
    get: (key: MemoKey) => requireContext('memo').memo.get(key),
    set: <TKey extends MemoKey>(key: TKey, value: MemoValue<TKey>) => requireContext('memo').memo.set(key, value),
    has: (key: MemoKey) => requireContext('memo').memo.has(key),
  },
) as Memo & typeof storeMemo

/**
 * Returns the options the user passed to the plugin being set up, like `ctx.options`. Runs only in `setup` and `kubb:plugin:setup`.
 */
export function useOptions<TFactory extends PluginType = PluginType>(): TFactory['options'] {
  return requireSetupContext('useOptions').options as TFactory['options']
}

/**
 * Sets the resolved options of the plugin being set up, like `ctx.setOptions`. Runs only in `setup` and `kubb:plugin:setup`.
 */
export function setOptions<TFactory extends PluginType = PluginType>(options: TFactory['resolvedOptions']): void {
  requireSetupContext('setOptions').setOptions(options)
}

/**
 * Returns the resolved build configuration, like `ctx.config`.
 */
export function useConfig(): Config {
  return requireContext('useConfig').config
}

/**
 * Returns another plugin from the config, typed through `Kubb.PluginRegistry`, like `ctx.requirePlugin`.
 */
export function requirePlugin<TName extends PluginName>(name: TName): NormalizedPlugin<ResolvePluginOptions<TName>> {
  return requireContext('requirePlugin').requirePlugin(name) as NormalizedPlugin<ResolvePluginOptions<TName>>
}
