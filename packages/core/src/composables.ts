import { AsyncLocalStorage } from 'node:async_hooks'
import type { Macro, UserFileNode } from '@kubb/ast'
import type { Generator } from './defineGenerator.ts'
import type { KubbPluginSetupContext, NormalizedPlugin, PluginType, PluginName, ResolvePluginOptions } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Memo } from './memo.ts'
import type { Resolver, ResolverPatch } from './Resolver.ts'
import type { Config } from './types.ts'

const kubbContextKey = Symbol.for('kubb.context')

type KubbContextHost = typeof globalThis & { [kubbContextKey]?: AsyncLocalStorage<KubbPluginSetupContext> }

const host = globalThis as KubbContextHost

/**
 * Holds the setup context of the plugin whose `setup` or `kubb:plugin:setup` is running. `KubbDriver` sets it for each plugin.
 *
 * The store lives on `globalThis`, so the ESM and CommonJS builds of `@kubb/core` share one. A plugin that a
 * CommonJS config loads would otherwise read an empty store and fail with `KUBB_NO_CONTEXT`.
 */
export const kubbContext: AsyncLocalStorage<KubbPluginSetupContext> = (host[kubbContextKey] ??= new AsyncLocalStorage<KubbPluginSetupContext>())

function requireContext(caller: string): KubbPluginSetupContext {
  const ctx = kubbContext.getStore()
  if (ctx) return ctx

  throw new Diagnostics.Error({
    code: Diagnostics.code.noContext,
    severity: 'error',
    message: `\`${caller}()\` was called outside a plugin setup.`,
    help: `Call \`${caller}()\` inside \`setup\` or \`kubb:plugin:setup\`, including in code that setup awaits.`,
  })
}

/**
 * Returns the context of the plugin whose `kubb:plugin:setup` is running. It stays available after an `await`.
 * Throws `KUBB_NO_CONTEXT` outside setup.
 */
export function useKubb<TFactory extends PluginType = PluginType>(): KubbPluginSetupContext<TFactory> {
  return requireContext('useKubb') as KubbPluginSetupContext<TFactory>
}

/**
 * Returns the same context as {@link useKubb}, or `undefined` outside `setup` and `kubb:plugin:setup`.
 */
export function tryUseKubb<TFactory extends PluginType = PluginType>(): KubbPluginSetupContext<TFactory> | undefined {
  return kubbContext.getStore() as KubbPluginSetupContext<TFactory> | undefined
}

/**
 * Registers generators on the plugin being set up, like `ctx.addGenerator`.
 *
 * @example
 * `addGenerator(typeGenerator, enumGenerator)`
 */
export function addGenerator<TFactory extends PluginType = PluginType, TElement = unknown>(...generators: Array<Generator<TFactory, TElement>>): void {
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
 * Returns a value computed once per build and shared by every plugin, like `ctx.memo`.
 */
export const memo: Memo = (key, compute) => requireContext('memo').memo(key, compute)

/**
 * Returns the options the user passed to the plugin being set up, like `ctx.options`.
 */
export function useOptions<TFactory extends PluginType = PluginType>(): TFactory['options'] {
  return requireContext('useOptions').options as TFactory['options']
}

/**
 * Sets the resolved options of the plugin being set up, like `ctx.setOptions`.
 */
export function setOptions<TFactory extends PluginType = PluginType>(options: TFactory['resolvedOptions']): void {
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
