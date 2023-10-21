import type { KubbPlugin, PluginLifecycle, PluginLifecycleHooks } from '../../types.ts'

export type RequiredPluginLifecycle =Required<PluginLifecycle>

/**
 * Get the type of the first argument in a function.
 * @example Arg0<(a: string, b: number) => void> -> string
 */
export type Argument0<H extends keyof PluginLifecycle> = Parameters<RequiredPluginLifecycle[H]>[0]

export type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookReduceArg0' | 'hookSeq'

export type Executer<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  strategy: Strategy
  hookName: H
  plugin: KubbPlugin
  parameters?: unknown[] | undefined
  output?: unknown
}

export type ParseResult<H extends PluginLifecycleHooks> = RequiredPluginLifecycle[H]

export type SafeParseResult<H extends PluginLifecycleHooks, Result = ReturnType<ParseResult<H>>> = {
  result: Result
  plugin: KubbPlugin
}

export type PluginParameter<H extends PluginLifecycleHooks> = Parameters<RequiredPluginLifecycle[H]>
