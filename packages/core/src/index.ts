import { build } from './build.ts'

import type { ObjValueTuple, TupleToUnion } from './types.ts'

export { build } from './build.ts'
export { defineConfig, isInputPath } from './config.ts'
export * from './generators/index.ts'
export * from './managers/index.ts'
// dprint-ignore
export { createPlugin, pluginName as name, pluginName } from './plugin.ts'
export * from './types.ts'
export * from './utils/index.ts'

export interface _Register {}
export type Plugins = _Register
export type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

export type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

export type PluginUnion = TupleToUnion<ObjValueTuple<OptionsPlugins>>

export type Plugin = keyof Plugins

export default build
