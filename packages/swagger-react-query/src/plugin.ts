import pathParser from 'path'

import { createPlugin, validatePlugins, getPathMode } from '@kubb/core'
import { pluginName as swaggerTypescriptPluginName } from '@kubb/swagger-typescript'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi } from '@kubb/swagger'
import type { Api as SwaggerTypescriptApi } from '@kubb/swagger-typescript'

import { OperationGenerator } from './generators'

import type { PluginOptions } from './types'

export const pluginName = 'swagger-react-query' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'hooks', types = { output: '' } } = options
  let swaggerApi: SwaggerApi
  let swaggerTypescriptApi: SwaggerTypescriptApi

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName, swaggerTypescriptPluginName])
      if (valid) {
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api
        swaggerTypescriptApi = plugins.find((plugin) => plugin.name === swaggerTypescriptPluginName)?.api
      }

      return valid
    },
    resolveId(fileName, directory, options: { type: 'model' }) {
      if (!directory) {
        return null
      }
      if (options?.type === 'model') {
        return pathParser.resolve(directory, output, types.output, fileName)
      }

      const mode = getPathMode(pathParser.resolve(directory, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return pathParser.resolve(directory, output)
      }

      return pathParser.resolve(directory, output, fileName)
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const directory = pathParser.resolve(this.config.root, this.config.output.path)

      const operationGenerator = new OperationGenerator({
        oas,
        directory,
        fileManager: this.fileManager,
        resolveId: this.resolveId,
      })

      await operationGenerator.build()
    },
  }
})
