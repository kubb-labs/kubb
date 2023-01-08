import type { PluginLifecycle } from '../../types'
/**
 * Get the type of the first argument in a function.
 * @example Arg0<(a: string, b: number) => void> -> string
 */
export type Argument0<H extends keyof PluginLifecycle> = Parameters<PluginLifecycle[H]>[0]

export type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookReduceArg0' | 'hookSeq'
