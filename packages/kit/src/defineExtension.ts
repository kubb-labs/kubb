import { defineExtension as coreDefineExtension, type PluginDefinition, type PluginFactory, type PluginType, type PluginVisitHooks } from '@kubb/core'
import { slot } from './composables.ts'
import { generatorVisitor } from './visitor.ts'

type AnyHook = (...args: Array<never>) => unknown

const define = coreDefineExtension as (definition: unknown) => unknown

/**
 * Core's `defineExtension`. For `kind: 'plugin'` it also keeps the plugin's generators, resolver
 * and macros in memo and runs them through the visit hooks, before any visit hooks the plugin
 * defines itself.
 */
export const defineExtension = ((definition: { kind: string } & Partial<PluginDefinition>) => {
  if (definition.kind !== 'plugin') return define(definition)

  const visitor = generatorVisitor()
  const hooks: Record<string, unknown> = { ...definition.hooks }
  for (const name of Object.keys(visitor) as Array<keyof PluginVisitHooks>) {
    const own = definition.hooks?.[name] as AnyHook | undefined
    const kit = visitor[name] as AnyHook
    hooks[name] = own
      ? async (...args: Array<never>) => {
          await kit(...args)
          await own(...args)
        }
      : kit
  }

  return define({
    ...definition,
    hooks,
    setup(options: object, kubb: Parameters<NonNullable<PluginDefinition['setup']>>[1]) {
      kubb.memo.set(slot.kit(kubb.plugin.name), true)
      return definition.setup ? definition.setup(options, kubb) : options
    },
  })
}) as typeof coreDefineExtension

/**
 * Defines a plugin through kit's `defineExtension`, so it runs kit's visitor.
 *
 * @deprecated Use `defineExtension` with `kind: 'plugin'` instead.
 */
export function definePlugin<TFactory extends PluginType = PluginType>(definition: PluginDefinition<TFactory>): PluginFactory<TFactory> {
  return defineExtension({ kind: 'plugin', ...definition })
}
