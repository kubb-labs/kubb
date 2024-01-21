import type { ObjValueTuple, TupleToUnion } from '@kubb/types'
import type { _Register } from './index.ts'

export type Plugins = _Register
export type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

export type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

export type PluginUnion = TupleToUnion<ObjValueTuple<OptionsPlugins>>

export type Plugin = keyof Plugins
