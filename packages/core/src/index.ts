import { build } from './build.ts'

import type { ObjValueTuple, TupleToUnion } from './types.ts'

export { build } from './build.ts'
export { defineConfig, isInputPath } from './config.ts'
export { ParallelPluginError, PluginError, SummaryError, ValidationPluginError, Warning } from './errors.ts'
export type { KubbFile } from './FileManager.ts'
export { FileManager } from './FileManager.ts'
export { Generator } from './Generator.ts'
export { PackageManager } from './PackageManager.ts'
export { createPlugin, pluginName, pluginName as name } from './plugin.ts'
export { PluginManager } from './PluginManager.ts'
export { isPromise, isPromiseFulfilledResult, isPromiseRejectedResult, PromiseManager } from './PromiseManager.ts'
export { SchemaGenerator } from './SchemaGenerator.ts'
export * from './types.ts'
export * from './utils/index.ts'

export interface _Register {}
export type Plugins = _Register
export type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

export type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

export type PluginUnion = TupleToUnion<ObjValueTuple<OptionsPlugins>>

export type Plugin = keyof Plugins

export default build
