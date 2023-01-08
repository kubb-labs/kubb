import pathParser from 'path'

import { createPluginCache } from './utils'

import type { FileManager, EmittedFile, File } from './managers/fileManager'
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
  resolveId: PluginContext['resolveId']
  load: PluginContext['load']
}

// not publicly exported
export type CorePluginOptions = PluginFactoryOptions<Options, false, PluginContext>

export const name = 'core' as const

const isEmittedFile = (result: EmittedFile | File): result is EmittedFile => {
  return !!(result as any).id
}

export const definePlugin = createPlugin<CorePluginOptions>((options) => {
  const { fileManager, resolveId, load } = options
  const indexFiles: File[] = []

  const api: PluginContext = {
    get config() {
      return options.config
    },
    fileManager,
    async addFile(file, options) {
      if (isEmittedFile(file)) {
        const resolvedId = await resolveId({ fileName: file.id, directory: file.importer, options: file.options })
        const path = resolvedId || file.importer || file.id

        return fileManager.add({
          path,
          fileName: file.name || file.id,
          source: file.source || '',
        })
      }

      if (options?.root) {
        indexFiles.push(file)
      }

      return fileManager.addOrAppend(file)
    },
    resolveId,
    load,
    cache: createPluginCache(Object.create(null)),
  }

  return {
    name,
    api,
    resolveId(fileName, directory) {
      if (!directory) {
        return null
      }
      return pathParser.resolve(directory, fileName)
    },
  }
})
