import pathParser from 'node:path'

import { createPluginCache, transformReservedWord } from './utils/index.ts'

import type { Executer } from './managers/index.ts'
import type { FileManager } from './managers/fileManager/FileManager.ts'
import type { PluginContext, KubbPlugin, PluginFactoryOptions, PluginLifecycleHooks } from './types.ts'

type KubbPluginFactory<T extends PluginFactoryOptions = PluginFactoryOptions> = (
  options: T['options']
) => T['nested'] extends true ? Array<KubbPlugin<T>> : KubbPlugin<T>

export function createPlugin<T extends PluginFactoryOptions = PluginFactoryOptions>(factory: KubbPluginFactory<T>) {
  return (options: T['options']) => {
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
  getExecuter: () => Executer<PluginLifecycleHooks> | undefined
}

// not publicly exported
export type CorePluginOptions = PluginFactoryOptions<Options, false, PluginContext>

export const name = 'core' as const

export const definePlugin = createPlugin<CorePluginOptions>((options) => {
  const { fileManager, resolvePath, resolveName, load, getExecuter } = options

  const api: PluginContext = {
    get config() {
      return options.config
    },
    fileManager,
    async addFile(...files) {
      return Promise.all(
        files.map((file) => {
          const executer = getExecuter()
          // console.log('executer ', executer?.plugin?.name, file.meta)

          if (file.override) {
            return fileManager.add(file)
          }

          return fileManager.addOrAppend(file)
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

  return {
    name,
    options,
    api,
    resolvePath(fileName) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, fileName)
    },
    resolveName(name) {
      return name
    },
  }
})
