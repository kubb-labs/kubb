import pathParser from 'path'

import { createPluginCache } from './utils'

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
    async addFile(file) {
      return fileManager.addOrAppend(file)
    },
    resolvePath,
    resolveName,
    load,
    cache: createPluginCache(Object.create(null)),
  }

  return {
    name,
    options,
    api,
    resolvePath(fileName, directory) {
      if (!directory) {
        return null
      }
      return pathParser.resolve(directory, fileName)
    },
    resolveName(name) {
      return name
    },
  }
})
