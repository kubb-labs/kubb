import { AsyncLocalStorage } from 'node:async_hooks'
import type { Macro, UserFileNode } from '@kubb/ast'
import type { Generator } from './defineGenerator.ts'
import type { KubbPluginSetupContext, NormalizedPlugin, PluginFactoryOptions, PluginName, ResolvePluginOptions } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Resolver, ResolverPatch } from './Resolver.ts'

/**
 * Holds the setup context of the plugin whose `kubb:plugin:setup` is running. `KubbDriver` enters it
 * for each plugin, so the composables below reach that plugin's context without a `ctx` argument.
 */
export const kubbContext = new AsyncLocalStorage<KubbPluginSetupContext>()

function requireContext(caller: string): KubbPluginSetupContext {
  const ctx = kubbContext.getStore()
  if (ctx) return ctx

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    message: `\`${caller}()\` was called outside a plugin setup.`,
    help: `Call \`${caller}()\` inside \`kubb:plugin:setup\`, or use the \`ctx\` argument that setup receives.`,
  })
}

/**
 * Returns the setup context of the plugin being set up. Throws `KUBB_NO_CONTEXT` outside
 * `kubb:plugin:setup`. The context survives an `await` inside setup.
 *
 * @example
 * ```ts
 * 'kubb:plugin:setup'() {
 *   const { config, options } = useKubb<PluginTs>()
 * }
 * ```
 */
export function useKubb<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPluginSetupContext<TFactory> {
  return requireContext('useKubb') as unknown as KubbPluginSetupContext<TFactory>
}

/**
 * Like {@link useKubb}, but returns `undefined` outside `kubb:plugin:setup` instead of throwing.
 */
export function tryUseKubb<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPluginSetupContext<TFactory> | undefined {
  return kubbContext.getStore() as KubbPluginSetupContext<TFactory> | undefined
}

/**
 * Registers generators on the plugin being set up. Same as `ctx.addGenerator`.
 *
 * @example
 * ```ts
 * 'kubb:plugin:setup'() {
 *   addGenerator(typeGenerator, enumGenerator)
 * }
 * ```
 */
export function addGenerator<TFactory extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown>(
  ...generators: Array<Generator<TFactory, TElement>>
): void {
  requireContext('addGenerator').addGenerator(...(generators as Array<Generator>))
}

/**
 * Sets the resolver of the plugin being set up. Same as `ctx.setResolver`.
 */
export function setResolver<TResolver extends Resolver = Resolver>(resolver: ResolverPatch<TResolver> | TResolver): void {
  requireContext('setResolver').setResolver(resolver as ResolverPatch)
}

/**
 * Adds a macro to the plugin being set up. Same as `ctx.addMacro`.
 */
export function addMacro(macro: Macro): void {
  requireContext('addMacro').addMacro(macro)
}

/**
 * Replaces the macros of the plugin being set up. Same as `ctx.setMacros`.
 */
export function setMacros(macros: ReadonlyArray<Macro>): void {
  requireContext('setMacros').setMacros(macros)
}

/**
 * Adds a raw file to the build output. Same as `ctx.injectFile`.
 */
export function injectFile(file: UserFileNode): void {
  requireContext('injectFile').injectFile(file)
}

/**
 * Returns another plugin from the config, typed through `Kubb.PluginRegistry`. Fails the run with
 * `KUBB_PLUGIN_NOT_FOUND` when the config lacks it. Same as `ctx.requirePlugin`.
 *
 * @example
 * ```ts
 * 'kubb:plugin:setup'() {
 *   const pluginTs = usePlugin('plugin-ts')
 * }
 * ```
 */
export function usePlugin<TName extends PluginName>(name: TName): NormalizedPlugin<ResolvePluginOptions<TName>> {
  return requireContext('usePlugin').requirePlugin(name) as unknown as NormalizedPlugin<ResolvePluginOptions<TName>>
}
