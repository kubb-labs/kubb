import type { Macro } from '@kubb/ast'
import { type Generator, type KubbPluginSetupContext, type PluginType, type ResolverInput, type ResolverLike, useKubb } from '@kubb/core'
import { Resolver } from './resolver/Resolver.ts'

/**
 * Memo slots kit keeps per plugin, under `<plugin>:<slot>`.
 */
export const slot = {
  kit: (name: string) => `${name}:kit`,
  generators: (name: string) => `${name}:generators`,
  resolver: (name: string) => `${name}:resolver`,
  macros: (name: string) => `${name}:macros`,
} as const

/**
 * Returns the setup context when the plugin was defined with kit's `defineExtension`, so its
 * concepts live in memo. Any other plugin keeps the core path.
 */
function kitContext(): KubbPluginSetupContext | undefined {
  const ctx = useKubb()
  return ctx.memo.get(slot.kit(ctx.plugin.name)) ? ctx : undefined
}

/**
 * Registers generators on the plugin being set up.
 *
 * @example
 * `addGenerator(typeGenerator, enumGenerator)`
 */
export function addGenerator<TFactory extends PluginType = PluginType, TElement = unknown>(...generators: Array<Generator<TFactory, TElement>>): void {
  const ctx = kitContext()
  if (!ctx) return useKubb<TFactory>().addGenerator(...generators)

  const key = slot.generators(ctx.plugin.name)
  ctx.memo.set(key, [...((ctx.memo.get(key) as Array<Generator> | undefined) ?? []), ...(generators as Array<Generator>)])
}

/**
 * Sets the resolver of the plugin being set up. Overrides merge over the default resolver, so a
 * partial patch replaces only the methods it names.
 */
export function setResolver<TResolver extends ResolverLike = ResolverLike>(resolver: ResolverInput<TResolver>): void {
  const ctx = kitContext()
  if (!ctx) return useKubb().setResolver(resolver as ResolverInput)

  const { name } = ctx.plugin
  const shared = ctx.memo.get('kubb:sharedSchemas')
  const parts = (Array.isArray(resolver) ? resolver : [resolver]) as Array<ResolverLike>
  ctx.memo.set(slot.resolver(name), Resolver.merge(new Resolver({ pluginName: name, shared }), ...parts))
}

/**
 * Adds a macro to the plugin being set up. Macros with the same `enforce` run in the order they
 * are added. `enforce: 'pre'` macros run first and `enforce: 'post'` macros run last.
 */
export function addMacro(macro: Macro): void {
  const ctx = kitContext()
  if (!ctx) return useKubb().addMacro(macro)

  const key = slot.macros(ctx.plugin.name)
  ctx.memo.set(key, [...((ctx.memo.get(key) as Array<Macro> | undefined) ?? []), macro])
}

/**
 * Replaces the macros of the plugin being set up.
 */
export function setMacros(macros: ReadonlyArray<Macro>): void {
  const ctx = kitContext()
  if (!ctx) return useKubb().setMacros(macros)

  ctx.memo.set(slot.macros(ctx.plugin.name), [...macros])
}
