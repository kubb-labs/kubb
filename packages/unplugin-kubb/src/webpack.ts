import type { UnpluginFactoryOutput } from 'unplugin'
import { createWebpackPlugin } from 'unplugin'
import type { WebpackPluginInstance } from 'webpack'
import { unpluginFactory } from './index.ts'
import type { Options } from './types.ts'

export default createWebpackPlugin(unpluginFactory) as unknown as UnpluginFactoryOutput<Options, WebpackPluginInstance>
