import pathParser from 'node:path'

import { createPluginCache } from './utils/index.ts'

import type { FileManager } from './managers/fileManager/FileManager.ts'
import type { PluginManager } from './managers/pluginManager/PluginManager.ts'
import type { KubbPlugin, KubbUserPlugin, PluginContext, PluginFactoryOptions } from './types.ts'

type KubbPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (
  options: T['options'],
) => T['nested'] extends true ? Array<KubbUserPlugin<T>> : KubbUserPlugin<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(factory: KubbPluginFactory<T>) {
  return (options: T['options']): ReturnType<KubbPluginFactory<T>> => {
    const plugin = factory(options)
    if (Array.isArray(plugin)) {
      throw new Error('Not implemented')
    }

    return plugin
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
  plugin: PluginContext['plugin']
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
      // TODO watch out, typing is incorrect, `this` will be `null` with that core is normally the `this`
      return {
        get config() {
          return options.config
        },
        get plugins() {
          return options.getPlugins()
        },
        get plugin() {
          return options.plugin
        },
        logger,
        fileManager,
        pluginManager,
        async addFile(...files) {
          return Promise.all(
            files.map((file) => {
              if (file.override) {
                return fileManager.add(file)
              }

              return fileManager.addOrAppend(file)
            }),
          )
        },
        resolvePath,
        resolveName,
        cache: createPluginCache(),
      }
    },
    resolvePath(baseName) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, baseName)
    },
    resolveName(name) {
      return name
    },
  }
})
