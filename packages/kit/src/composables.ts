import { AsyncLocalStorage } from 'node:async_hooks'
import type { Macro } from '@kubb/ast'
import { Diagnostics, type KubbPluginSetupContext, type Memo, type MemoKey, type MemoValue, type PluginType, tryUseKubb, useKubb } from '@kubb/core'
import { Resolver } from './resolver/Resolver.ts'
import type { ResolverInput } from './resolver/types.ts'
import type { DefaultPluginType, Generator, PrinterFactory } from './types.ts'

/**
 * Memo slots kit keeps per plugin, under `<plugin>:<slot>`.
 */
export const slot = {
  kit: (name: string) => `${name}:kit`,
  generators: (name: string) => `${name}:generators`,
  resolver: (name: string) => `${name}:resolver`,
  macros: (name: string) => `${name}:macros`,
  printer: (name: string) => `${name}:printer`,
} as const

/**
 * Returns the resolver a plugin keeps in memo, or a default resolver for that plugin.
 *
 * @example
 * `getResolver({ memo }, 'plugin-ts').file({ name: 'pet', extname: '.ts', root, output })`
 */
export function getResolver(ctx: { memo: Pick<Memo, 'get'> }, pluginName: string): Resolver {
  const stored = ctx.memo.get(slot.resolver(pluginName)) as Resolver | undefined
  return stored ?? new Resolver({ pluginName, shared: ctx.memo.get('kubb:sharedSchemas') })
}

/**
 * Like `getResolver`, but stores the default resolver, so the walk keeps one resolver per plugin.
 */
export function resolverFor(memo: Pick<Memo, 'get' | 'set'>, pluginName: string): Resolver {
  const resolver = getResolver({ memo }, pluginName)
  memo.set(slot.resolver(pluginName), resolver)
  return resolver
}

// Returns the setup context of a plugin defined with kit's `defineExtension`, the only kind that runs kit's visitor.
function kitContext(caller: string): KubbPluginSetupContext {
  const ctx = useKubb()
  if (ctx.memo.get(slot.kit(ctx.plugin.name))) return ctx

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    plugin: ctx.plugin.name,
    message: `\`${caller}()\` was called for plugin "${ctx.plugin.name}", which is not defined with \`defineExtension\` from \`@kubb/kit\`.`,
    help: 'Import `defineExtension` from `@kubb/kit` instead of `@kubb/core`.',
  })
}

/**
 * Registers generators on the plugin being set up.
 *
 * @example
 * `addGenerator(typeGenerator, enumGenerator)`
 */
export function addGenerator<TFactory extends PluginType = DefaultPluginType, TElement = unknown>(...generators: Array<Generator<TFactory, TElement>>): void {
  const ctx = kitContext('addGenerator')
  const key = slot.generators(ctx.plugin.name)
  ctx.memo.set(key, [...((ctx.memo.get(key) as Array<Generator> | undefined) ?? []), ...(generators as Array<Generator>)])
}

/**
 * Sets the resolver of the plugin being set up. Overrides merge over the default resolver, so a
 * partial patch replaces only the methods it names.
 */
export function setResolver<TResolver extends Resolver = Resolver>(resolver: ResolverInput<TResolver>): void {
  const ctx = kitContext('setResolver')
  const { name } = ctx.plugin
  const shared = ctx.memo.get('kubb:sharedSchemas')
  const parts = (Array.isArray(resolver) ? resolver : [resolver]) as Array<Resolver>
  ctx.memo.set(slot.resolver(name), Resolver.merge(new Resolver({ pluginName: name, shared }), ...parts))
}

/**
 * Adds a macro to the plugin being set up. Macros with the same `enforce` run in the order they
 * are added. `enforce: 'pre'` macros run first and `enforce: 'post'` macros run last.
 */
export function addMacro(macro: Macro): void {
  const ctx = kitContext('addMacro')
  const key = slot.macros(ctx.plugin.name)
  ctx.memo.set(key, [...((ctx.memo.get(key) as Array<Macro> | undefined) ?? []), macro])
}

/**
 * Replaces the macros of the plugin being set up.
 */
export function setMacros(macros: ReadonlyArray<Macro>): void {
  const ctx = kitContext('setMacros')
  ctx.memo.set(slot.macros(ctx.plugin.name), [...macros])
}

/**
 * Sets the printer factory of the plugin being set up. Kit calls it with the printer context, once
 * per build and once per matching `override`, and hands the result to generators as `ctx.printer`.
 *
 * @example
 * `setPrinter((ctx) => printerTs({ optionalType: ctx.options.optionalType, resolver: ctx.resolver }))`
 */
export function setPrinter<TFactory extends PluginType = DefaultPluginType>(factory: PrinterFactory<TFactory>): void {
  const ctx = kitContext('setPrinter')
  ctx.memo.set(slot.printer(ctx.plugin.name), factory)
}

const walkMemoKey = Symbol.for('kubb.kit.walkMemo')
type WalkMemoHost = typeof globalThis & { [walkMemoKey]?: AsyncLocalStorage<Memo> }

/**
 * Holds the build memo while kit's visitor runs a plugin's printer factory, generators and their rendering.
 * It lives on `globalThis`, like core's setup context, so the ESM and CommonJS builds of kit share one.
 */
export const walkMemo: AsyncLocalStorage<Memo> = ((globalThis as WalkMemoHost)[walkMemoKey] ??= new AsyncLocalStorage<Memo>())

/**
 * Computes a value once per build and returns it on every later call with the same key. Works in `setup`, in a
 * `setPrinter` factory, and in generators and the printers they render. Outside a build it computes the value on
 * every call, so a printer used on its own still works.
 *
 * @example
 * `const cache = useMemo('plugin-zod:directionalNodes', () => new WeakMap())`
 */
export function useMemo<TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue): TValue {
  const memo = walkMemo.getStore() ?? tryUseKubb()?.memo
  return memo ? memo(key, compute) : compute()
}
