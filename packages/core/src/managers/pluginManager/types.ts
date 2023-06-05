import type { PluginManager } from './PluginManager.ts'
import type { KubbPlugin, PluginLifecycle, PluginLifecycleHooks } from '../../types.ts'
/**
 * Get the type of the first argument in a function.
 * @example Arg0<(a: string, b: number) => void> -> string
 */
export type Argument0<H extends keyof PluginLifecycle> = Parameters<PluginLifecycle[H]>[0]

export type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookReduceArg0' | 'hookSeq'

export type Executer<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  strategy: Strategy
  hookName: H
  plugin: KubbPlugin
}

export type OnExecute<H extends PluginLifecycleHooks = PluginLifecycleHooks> = (this: PluginManager, executer: Executer<H> | undefined) => void
