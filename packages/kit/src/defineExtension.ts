import { defineExtension as coreDefineExtension, type PluginDefinition, type PluginVisitHooks } from '@kubb/core'
import { slot } from './composables.ts'
import { generatorVisitor } from './visitor.ts'

type VisitHookName = keyof PluginVisitHooks
type AnyHook = (...args: Array<never>) => unknown

/**
 * Core's `defineExtension`. For `kind: 'plugin'` it also keeps the plugin's generators, resolver
 * and macros in memo and runs them through the visit hooks, before any visit hooks the plugin
 * defines itself.
 */
export const defineExtension = ((definition: { kind: string } & Partial<PluginDefinition>) => {
  if (definition.kind !== 'plugin') return (coreDefineExtension as (definition: unknown) => unknown)(definition)

  const visitor = generatorVisitor()
  const hooks: Record<string, unknown> = { ...definition.hooks }
  for (const name of Object.keys(visitor) as Array<VisitHookName>) {
    const own = definition.hooks?.[name] as AnyHook | undefined
    const kit = visitor[name] as AnyHook
    hooks[name] = own
      ? async (...args: Array<never>) => {
          await kit(...args)
          await own(...args)
        }
      : kit
  }

  return (coreDefineExtension as (definition: unknown) => unknown)({
    ...definition,
    hooks,
    setup(options: object, kubb: Parameters<NonNullable<PluginDefinition['setup']>>[1]) {
      kubb.memo.set(slot.kit(kubb.plugin.name), true)
      return definition.setup ? definition.setup(options, kubb) : options
    },
  })
}) as typeof coreDefineExtension
