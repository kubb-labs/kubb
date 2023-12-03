import { build } from './build.ts'

import type { ObjValueTuple, TupleToUnion } from '@kubb/types'

export { build, safeBuild } from './build.ts'
export { defineConfig, isInputPath } from './config.ts'
export { Warning } from './errors.ts'
export { FileManager, KubbFile } from './FileManager.ts'
export { Generator } from './Generator.ts'
export { PackageManager } from './PackageManager.ts'
// dprint-ignore
export { createPlugin, pluginName as name, pluginName } from './plugin.ts'
export { PluginManager } from './PluginManager.ts'
export { PromiseManager } from './PromiseManager.ts'
export type * from './types.ts'

export interface _Register {}
export type Plugins = _Register
export type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

export type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

export type PluginUnion = TupleToUnion<ObjValueTuple<OptionsPlugins>>

export type Plugin = keyof Plugins

export default build
