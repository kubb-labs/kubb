import type { UnpluginFactoryOutput } from 'unplugin'
import { createWebpackPlugin } from 'unplugin'
import type { WebpackPluginInstance } from 'webpack'
import type { Options } from './types.ts'
import { unpluginFactory } from './unpluginFactory.ts'

export default createWebpackPlugin(unpluginFactory) as unknown as UnpluginFactoryOutput<Options, WebpackPluginInstance>
