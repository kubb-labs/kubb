import { AsyncLocalStorage } from 'node:async_hooks'
import type { Macro, UserFileNode } from '@kubb/ast'
import type { Generator } from './defineGenerator.ts'
import type { KubbPluginSetupContext, NormalizedPlugin, PluginFactoryOptions, PluginName, ResolvePluginOptions } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Resolver, ResolverPatch } from './Resolver.ts'
import type { Config } from './types.ts'

/**
 * Holds the setup context of the plugin whose `kubb:plugin:setup` is running. `KubbDriver` sets it for each plugin.
 */
export const kubbContext = new AsyncLocalStorage<KubbPluginSetupContext>()

function requireContext(caller: string): KubbPluginSetupContext {
  const ctx = kubbContext.getStore()
  if (ctx) return ctx

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    message: `\`${caller}()\` was called outside a plugin setup.`,
    help: `Call \`${caller}()\` inside \`kubb:plugin:setup\`, including in code that setup awaits.`,
  })
}

/**
 * Returns the context of the plugin whose `kubb:plugin:setup` is running. It stays available after an `await`.
 * Throws `KUBB_NO_CONTEXT` outside setup.
 */
export function useKubb<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPluginSetupContext<TFactory> {
  return requireContext('useKubb') as KubbPluginSetupContext<TFactory>
}

/**
 * Returns the same context as {@link useKubb}, or `undefined` outside `kubb:plugin:setup`.
 */
export function tryUseKubb<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPluginSetupContext<TFactory> | undefined {
  return kubbContext.getStore() as KubbPluginSetupContext<TFactory> | undefined
}

/**
 * Registers generators on the plugin being set up, like `ctx.addGenerator`.
 *
 * @example
 * `addGenerator(typeGenerator, enumGenerator)`
 */
export function addGenerator<TFactory extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown>(
  ...generators: Array<Generator<TFactory, TElement>>
): void {
  requireContext('addGenerator').addGenerator(...generators)
}

/**
 * Sets the resolver of the plugin being set up, like `ctx.setResolver`.
 */
export function setResolver<TResolver extends Resolver = Resolver>(resolver: ResolverPatch<TResolver> | TResolver): void {
  requireContext('setResolver').setResolver(resolver)
}

/**
 * Adds a macro to the plugin being set up, like `ctx.addMacro`.
 */
export function addMacro(macro: Macro): void {
  requireContext('addMacro').addMacro(macro)
}

/**
 * Replaces the macros of the plugin being set up, like `ctx.setMacros`.
 */
export function setMacros(macros: ReadonlyArray<Macro>): void {
  requireContext('setMacros').setMacros(macros)
}

/**
 * Adds a raw file to the build output, like `ctx.injectFile`.
 */
export function injectFile(file: UserFileNode): void {
  requireContext('injectFile').injectFile(file)
}

/**
 * Returns the options the user passed to the plugin being set up, like `ctx.options`.
 */
export function useOptions<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(): TFactory['options'] {
  return requireContext('useOptions').options as TFactory['options']
}

/**
 * Sets the resolved options of the plugin being set up, like `ctx.setOptions`.
 */
export function setOptions<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(options: TFactory['resolvedOptions']): void {
  requireContext('setOptions').setOptions(options)
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
