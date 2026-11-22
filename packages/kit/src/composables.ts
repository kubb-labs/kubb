import type { Macro } from '@kubb/ast'
import { Diagnostics, type KubbContext, type KubbPluginSetupContext, type Memo, type PluginName, useKubb } from '@kubb/core'
import { Resolver } from './resolver/Resolver.ts'
import type { ResolverInput } from './resolver/types.ts'
import type { Generator, PluginType, PrinterFactory, ProvideName, ResolverFor } from './types.ts'

/**
 * Memo slots kit keeps per plugin, under `<plugin>:<slot>`, plus `provided` for a shared name, under `kit:provide:<name>`.
 */
export const slot = {
  kit: (name: string) => `${name}:kit`,
  generators: (name: string) => `${name}:generators`,
  resolver: (name: string) => `${name}:resolver`,
  macros: (name: string) => `${name}:macros`,
  printer: (name: string) => `${name}:printer`,
  provided: (name: string) => `kit:provide:${name}`,
} as const

type Provided = { priority: number; factory: () => Resolver; resolver?: Resolver }

/**
 * The resolver of the provider of `name`, built once per build so every reader shares its name reservations. `undefined` when nothing provides `name`.
 */
export function providedResolver(name: string, memo: Memo): Resolver | undefined {
  const provided = memo.get(slot.provided(name)) as Provided | undefined
  if (!provided) return undefined
  provided.resolver ??= provided.factory()
  return provided.resolver
}

/**
 * Returns the resolver a plugin keeps in memo, or for a provided name such as `'types'`, the resolver of its provider. Without one, it stores and returns a default resolver for
 * that plugin, so the build keeps one resolver per plugin. Reads the memo of the running hook unless you pass one.
 *
 * @example
 * `getResolver('plugin-ts').file({ name: 'pet', extname: '.ts', root, output })`
 */
export function getResolver<TName extends PluginName | ProvideName>(pluginName: TName, memo: Memo = useKubb().memo): ResolverFor<TName> {
  const key = slot.resolver(pluginName)
  const stored = providedResolver(pluginName, memo) ?? (memo.get(key) as Resolver | undefined)
  if (stored) return stored as ResolverFor<TName>

  const resolver = new Resolver({ pluginName, shared: memo.get('kubb:sharedSchemas') })
  memo.set(key, resolver)
  return resolver as ResolverFor<TName>
}

// Returns the setup context of a plugin defined with kit's `defineExtension`, the only kind that runs kit's visitor.
function kitContext(caller: string): KubbPluginSetupContext {
  const ctx = useKubb<KubbContext>()
  // A setup context is the only one with `setOptions`.
  if (!('setOptions' in ctx)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.noContext,
      severity: 'error',
      plugin: ctx.plugin.name,
      message: `\`${caller}()\` runs only in \`setup\` or \`kubb:plugin:setup\`.`,
      help: `Call \`${caller}()\` inside \`setup\` or \`kubb:plugin:setup\`, including in code that setup awaits.`,
    })
  }
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
 * Provides a resolver under a shared name, so `from(name)` reads it without naming this plugin.
 * The provider with the highest `priority` wins. On a tie, the first one stays. Kit calls `factory` once, when a generator first asks.
 */
export function provide<TName extends ProvideName>(
  name: TName,
  factory: () => Kubb.ProvideRegistry[TName],
  { priority = 0 }: { priority?: number } = {},
): void {
  const ctx = kitContext('provide')
  if (ctx.config.plugins.some((plugin) => plugin.name === name)) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginFailed,
      severity: 'error',
      plugin: ctx.plugin.name,
      message: `\`provide('${name}')\` uses the name of a plugin in the config, so it would replace that plugin's resolver.`,
      help: 'Provide a shared name that no plugin uses, such as `types`.',
    })
  }
  const key = slot.provided(name)
  const current = ctx.memo.get(key) as Provided | undefined
  if (!current || priority > current.priority) ctx.memo.set(key, { priority, factory: factory as () => Resolver })
}

/**
 * Sets the printer factory of the plugin being set up. Kit calls it with the printer context, once
 * per build and once per matching `override`, and hands the result to generators as `ctx.printer`.
 *
 * @example
 * `setPrinter((ctx) => printerTs({ optionalType: ctx.options.optionalType, resolver: ctx.resolver }))`
 */
export function setPrinter<TFactory extends PluginType = PluginType>(factory: PrinterFactory<TFactory>): void {
  const ctx = kitContext('setPrinter')
  ctx.memo.set(slot.printer(ctx.plugin.name), factory)
}
