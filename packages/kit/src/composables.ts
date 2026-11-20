import type { Macro } from '@kubb/ast'
import { Diagnostics, type KubbPluginSetupContext, type Memo, type PluginType, useKubb } from '@kubb/core'
import { Resolver } from './resolver/Resolver.ts'
import type { ResolverInput, ResolverLike } from './resolver/types.ts'
import type { Generator } from './types.ts'

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
 * Returns the resolver kept in memo for `pluginName`, and stores a default one the first time.
 */
export function resolverFor(memo: Pick<Memo, 'get' | 'set'>, pluginName: string): ResolverLike {
  const key = slot.resolver(pluginName)
  const existing = memo.get(key) as ResolverLike | undefined
  if (existing) return existing

  const resolver = new Resolver({ pluginName, shared: memo.get('kubb:sharedSchemas') })
  memo.set(key, resolver)
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
export function addGenerator<TFactory extends PluginType = PluginType, TElement = unknown>(...generators: Array<Generator<TFactory, TElement>>): void {
  const ctx = kitContext('addGenerator')
  const key = slot.generators(ctx.plugin.name)
  ctx.memo.set(key, [...((ctx.memo.get(key) as Array<Generator> | undefined) ?? []), ...(generators as Array<Generator>)])
}

/**
 * Sets the resolver of the plugin being set up. Overrides merge over the default resolver, so a
 * partial patch replaces only the methods it names.
 */
export function setResolver<TResolver extends ResolverLike = ResolverLike>(resolver: ResolverInput<TResolver>): void {
  const ctx = kitContext('setResolver')
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
