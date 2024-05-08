import path from 'node:path'

import { createPluginCache } from './utils/cache.ts'

import type { FileManager } from './FileManager.ts'
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
  config: PluginContext['config']
  fileManager: FileManager
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
  const { fileManager, pluginManager, resolvePath, resolveName, logger } = options

  return {
    name: 'core',
    options,
    key: ['core'],
    api() {
      return {
        get config() {
          return options.config
        },
        get plugins() {
          return options.getPlugins()
        },
        get plugin() {
          // see pluginManger.#execute where we override with `.call` the this with the correct plugin
          return options.plugin as NonNullable<Options['plugin']>
        },
        logger,
        fileManager,
        pluginManager,
        async addFile(...files) {
          const resolvedFiles = await fileManager.add(...files)

          if (!Array.isArray(resolvedFiles)) {
            return [resolvedFiles]
          }

          return resolvedFiles
        },
        resolvePath,
        resolveName,
        cache: createPluginCache(),
      }
    },
    resolvePath(baseName) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, baseName)
    },
    resolveName(name) {
      return name
    },
  }
})
