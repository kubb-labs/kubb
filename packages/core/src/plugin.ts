import pathParser from 'node:path'

import { createPluginCache, transformReservedWord } from './utils/index.ts'

import type { FileManager } from './managers/fileManager/FileManager.ts'
import type { KubbUserPlugin, PluginContext, PluginFactoryOptions } from './types.ts'

type KubbPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (
  options: T['options'],
) => T['nested'] extends true ? Array<KubbUserPlugin<T>> : KubbUserPlugin<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(factory: KubbPluginFactory<T>) {
  return (options: T['options']): ReturnType<KubbPluginFactory<T>> => {
    const plugin = factory(options)
    if (Array.isArray(plugin)) {
      throw new Error('Not implemented')
    }

    // default transform
    if (!plugin.transform) {
      plugin.transform = function transform(code) {
        return code
      }
    }

    return plugin
  }
}

type Options = {
  config: PluginContext['config']
  fileManager: FileManager
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  logger: PluginContext['logger']
}

// not publicly exported
export type CorePluginOptions = PluginFactoryOptions<'core', Options, false, PluginContext>

export const pluginName: CorePluginOptions['name'] = 'core' as const

export const definePlugin = createPlugin<CorePluginOptions>((options) => {
  const { fileManager, resolvePath, resolveName, logger } = options

  return {
    name: pluginName,
    options,
    api() {
      // TODO watch out, typing is incorrect, `this` will be `null` with that core is normally the `this`
      return {
        get config() {
          return options.config
        },
        logger,
        fileManager,
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
        resolveName: (params) => {
          const name = resolveName(params)

          return transformReservedWord(name)
        },
        cache: createPluginCache(),
      }
    },
    resolvePath(fileName) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, fileName)
    },
    resolveName(name) {
      return name
    },
  }
})
