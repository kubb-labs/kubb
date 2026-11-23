import type { Macro } from '@kubb/ast'
import {
  defineExtension as coreDefineExtension,
  type KubbPluginSetupContext,
  type Plugin,
  type PluginDefinition,
  type PluginFactory,
  type PluginType,
  type PluginVisitHooks,
} from '@kubb/core'
import { addGenerator, addMacro, provide, setMacros, setPrinter, setResolver, slot } from './composables.ts'
import { generatorVisitor } from './visitor.ts'

type AnyHook = (...args: Array<never>) => unknown

const define = coreDefineExtension as (definition: unknown) => unknown

/**
 * The setup context of a plugin defined with kit's `defineExtension`: core's setup context plus kit's
 * setup composables as methods. `kubb.addGenerator(...)` and `addGenerator(...)` register the same.
 */
export type KitSetupContext<TFactory extends PluginType = PluginType> = KubbPluginSetupContext<TFactory> & {
  addGenerator: typeof addGenerator
  setResolver: typeof setResolver
  addMacro: typeof addMacro
  setMacros: typeof setMacros
  setPrinter: typeof setPrinter
  provide: typeof provide
}

/**
 * Core's plugin definition, with `setup` and `kubb:plugin:setup` typed to receive {@link KitSetupContext}.
 */
export type KitPluginDefinition<TFactory extends PluginType = PluginType> = Omit<PluginDefinition<TFactory>, 'setup' | 'hooks'> & {
  hooks?: Omit<Plugin<TFactory>['hooks'], 'kubb:plugin:setup'> & {
    'kubb:plugin:setup'?(this: KitSetupContext<TFactory>, ctx: KitSetupContext<TFactory>): void | Promise<void>
  }
  setup?(
    this: KitSetupContext<TFactory>,
    options: TFactory['options'],
    kubb: KitSetupContext<TFactory>,
  ): TFactory['resolvedOptions'] | Promise<TFactory['resolvedOptions']>
}

type KitDefineExtension = (<TFactory extends PluginType = PluginType>(
  definition: { kind: 'plugin' } & KitPluginDefinition<TFactory>,
) => PluginFactory<TFactory>) &
  typeof coreDefineExtension

/**
 * Core's `defineExtension`. For `kind: 'plugin'` it also keeps the plugin's generators, resolver
 * and macros in memo and runs them through the visit hooks, before any visit hooks the plugin
 * defines itself. The setup context also gets kit's setup composables as methods.
 */
export const defineExtension = ((definition: { kind: string } & Partial<KitPluginDefinition>) => {
  if (definition.kind !== 'plugin') return define(definition)

  const visitor = generatorVisitor()
  const hooks: Record<string, unknown> = { ...definition.hooks }
  for (const name of Object.keys(visitor) as Array<keyof PluginVisitHooks>) {
    const own = definition.hooks?.[name] as AnyHook | undefined
    const kit = visitor[name] as AnyHook
    hooks[name] = own
      ? async function (this: unknown, ...args: Array<never>) {
          await kit.apply(this, args)
          await own.apply(this, args)
        }
      : kit
  }

  return define({
    ...definition,
    hooks,
    setup(options: object, kubb: KubbPluginSetupContext) {
      kubb.memo.set(slot.kit(kubb.plugin.name), true)
      // `kubb:plugin:setup` gets this same object, so it sees the methods too. A context that already
      // has a method, such as a test mock with spies, keeps its own.
      const ctx = kubb as KitSetupContext
      ctx.addGenerator ??= addGenerator
      ctx.setResolver ??= setResolver
      ctx.addMacro ??= addMacro
      ctx.setMacros ??= setMacros
      ctx.setPrinter ??= setPrinter
      ctx.provide ??= provide
      const { macros } = options as { macros?: Array<Macro> }
      if (macros?.length) kubb.memo.set(slot.userMacros(kubb.plugin.name), macros)
      return definition.setup ? definition.setup.call(ctx, options, ctx) : options
    },
  })
}) as KitDefineExtension

/**
 * Defines a plugin through kit's `defineExtension`, so it runs kit's visitor.
 *
 * @deprecated Use `defineExtension` with `kind: 'plugin'` instead.
 */
export function definePlugin<TFactory extends PluginType = PluginType>(definition: KitPluginDefinition<TFactory>): PluginFactory<TFactory> {
  return defineExtension({ kind: 'plugin', ...definition })
}
