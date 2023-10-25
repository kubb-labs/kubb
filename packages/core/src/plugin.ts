import path from 'node:path'

import { createPluginCache } from './utils/cache.ts'

import type { FileManager } from './FileManager.ts'
import type { PluginManager } from './PluginManager.ts'
import type { KubbPlugin, KubbUserPlugin, PluginContext, PluginFactoryOptions } from './types.ts'

type KubbPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (options: T['options']) => KubbUserPlugin<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(factory: KubbPluginFactory<T>) {
  return (options: T['options']): ReturnType<KubbPluginFactory<T>> => {
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
  getPlugins: () => KubbPlugin[]
  plugin?: PluginContext['plugin']
}

// not publicly exported
export type CorePluginOptions = PluginFactoryOptions<'core', 'controller', Options, false, PluginContext>

export const pluginName = 'core' satisfies CorePluginOptions['name']
export const pluginKey: CorePluginOptions['key'] = ['controller', pluginName] satisfies CorePluginOptions['key']

export const definePlugin = createPlugin<CorePluginOptions>((options) => {
  const { fileManager, pluginManager, resolvePath, resolveName, logger } = options

  return {
    name: pluginName,
    options,
    key: ['controller', 'core'],
    kind: 'controller',
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
