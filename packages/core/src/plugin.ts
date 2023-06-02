import pathParser from 'node:path'

import { createPluginCache, transformReservedWord } from './utils'

import type { FileManager } from './managers/fileManager'
import type { PluginContext, KubbPlugin, PluginFactoryOptions } from './types'

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
}

// not publicly exported
export type CorePluginOptions = PluginFactoryOptions<Options, false, PluginContext>

export const name = 'core' as const

export const definePlugin = createPlugin<CorePluginOptions>((options) => {
  const { fileManager, resolvePath, resolveName, load } = options

  const api: PluginContext = {
    get config() {
      return options.config
    },
    fileManager,
    async addFile(...files) {
      return Promise.all(files.map((file) => (file.override ? fileManager.add(file) : fileManager.addOrAppend(file))))
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
