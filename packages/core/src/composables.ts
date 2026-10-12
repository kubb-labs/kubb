import { AsyncLocalStorage } from 'node:async_hooks'
import type { Macro, UserFileNode } from '@kubb/ast'
import type { Generator } from './defineGenerator.ts'
import type { KubbPluginSetupContext, NormalizedPlugin, PluginFactoryOptions, PluginName, ResolvePluginOptions } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Resolver, ResolverPatch } from './Resolver.ts'

/** The setup context of the plugin whose `kubb:plugin:setup` is running, entered by `KubbDriver`. */
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
 * Returns the setup context of the plugin being set up, also after an `await` in setup.
 * Throws `KUBB_NO_CONTEXT` outside `kubb:plugin:setup`.
 */
export function useKubb<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPluginSetupContext<TFactory> {
  return requireContext('useKubb') as KubbPluginSetupContext<TFactory>
}

/** Like {@link useKubb}, but returns `undefined` outside `kubb:plugin:setup`. */
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
  requireContext('addGenerator').addGenerator(...generators)
}

/** Same as `ctx.setResolver`. */
export function setResolver<TResolver extends Resolver = Resolver>(resolver: ResolverPatch<TResolver> | TResolver): void {
  requireContext('setResolver').setResolver(resolver)
}

/** Same as `ctx.addMacro`. */
export function addMacro(macro: Macro): void {
  requireContext('addMacro').addMacro(macro)
}

/** Same as `ctx.setMacros`. */
export function setMacros(macros: ReadonlyArray<Macro>): void {
  requireContext('setMacros').setMacros(macros)
}

/** Same as `ctx.injectFile`. */
export function injectFile(file: UserFileNode): void {
  requireContext('injectFile').injectFile(file)
}

/** Returns another plugin, typed through `Kubb.PluginRegistry`. Same as `ctx.requirePlugin`. */
export function usePlugin<TName extends PluginName>(name: TName): NormalizedPlugin<ResolvePluginOptions<TName>> {
  return requireContext('usePlugin').requirePlugin(name) as NormalizedPlugin<ResolvePluginOptions<TName>>
}
