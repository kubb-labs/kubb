import path from 'node:path'

import type { Fabric } from '@kubb/react-fabric'
import type { PluginManager } from './PluginManager.ts'
import type { Plugin, PluginContext, PluginFactoryOptions, UserPluginWithLifeCycle } from './types.ts'

type PluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (options: T['options']) => UserPluginWithLifeCycle<T>

type OptionalPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (options?: T['options']) => UserPluginWithLifeCycle<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(factory: PluginFactory<T>): OptionalPluginFactory<T> {
  return (options = {}) => {
    return factory(options)
  }
}

type Options = {
  fabric: Fabric
  config: PluginContext['config']
  pluginManager: PluginManager
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  logger: PluginContext['logger']
  getPlugins: () => Array<Plugin>
  plugin?: PluginContext['plugin']
}

// not publicly exported
export type PluginCore = PluginFactoryOptions<'core', Options, Options, PluginContext, never>

export const pluginCore = createPlugin<PluginCore>((options) => {
  const { fabric, pluginManager, resolvePath, resolveName, logger } = options

  return {
    name: 'core',
    options,
    key: ['core'],
    context() {
      return {
        get fabric() {
          return fabric
        },
        get config() {
          return options.config
        },
        get plugins() {
          return options.getPlugins()
        },
        get plugin() {
          // see pluginManger.#execute where we override with `.call` the context with the correct plugin
          return options.plugin as NonNullable<Options['plugin']>
        },
        logger,
        get fileManager() {
          return fabric.context.fileManager
        },
        pluginManager,
        async addFile(...files) {
          const resolvedFiles = await fabric.context.fileManager.add(...files)

          if (!Array.isArray(resolvedFiles)) {
            return [resolvedFiles]
          }

          return resolvedFiles
        },
        resolvePath,
        resolveName,
      }
    },
    resolvePath(baseName) {
      const root = path.resolve(options.config.root, options.config.output.path)

      return path.resolve(root, baseName)
    },
    resolveName(name) {
      return name
    },
  }
})
