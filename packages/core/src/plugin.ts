import pathParser from 'node:path'

import { createPluginCache, getStackTrace, transformReservedWord } from './utils/index.ts'

import type { FileManager } from './managers/fileManager/FileManager.ts'
import type { KubbUserPlugin, PluginContext, PluginFactoryOptions } from './types.ts'

type KubbPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (
  options: T['options']
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
  load: PluginContext['load']
  logger: PluginContext['logger']
}

// not publicly exported
export type CorePluginOptions = PluginFactoryOptions<'core', Options, false, PluginContext>

export const pluginName: CorePluginOptions['name'] = 'core' as const

export const definePlugin = createPlugin<CorePluginOptions>((options) => {
  const { fileManager, resolvePath, resolveName, load, logger } = options

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
          // TODO unstable, based on stack trace and name of the file(can be different)
          const trace = getStackTrace()
          const plugins = options.config.plugins
            ?.filter((plugin) => trace[1].getFileName()?.includes(plugin.name))
            .sort((a, b) => {
              if (a.name.length < b.name.length) {
                return 1
              }
              if (a.name.length > b.name.length) {
                return -1
              }
              return 0
            })
          const pluginName = plugins?.[0]?.name

          return Promise.all(
            files.map((file) => {
              const fileWithMeta = {
                ...file,
                meta: {
                  ...(file.meta || {}),
                  pluginName,
                },
              }

              if (file.override) {
                return fileManager.add(fileWithMeta)
              }

              return fileManager.addOrAppend(fileWithMeta)
            })
          )
        },
        resolvePath,
        resolveName: (params) => {
          const name = resolveName(params)

          return transformReservedWord(name)
        },
        load,
        cache: createPluginCache(Object.create(null)),
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
