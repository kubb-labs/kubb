import { createWebpackPlugin } from 'unplugin'

import { unpluginFactory } from './index.ts'

import type { UnpluginFactoryOutput } from 'unplugin'
import type { WebpackPluginInstance } from 'webpack'
import type { Options } from './types.ts'

// resolves issue for: The inferred type of 'default' cannot be named without a reference to 'node_modules/webpack'. This is likely not portable. A type annotation is necessary.
export default createWebpackPlugin(unpluginFactory) as unknown as UnpluginFactoryOutput<Options, WebpackPluginInstance>
