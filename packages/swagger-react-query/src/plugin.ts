import pathParser from 'path'

import { getRelativePath, createPlugin, validatePlugins } from '@kubb/core'
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
      return pathParser.resolve(directory, output, fileName)
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const directory = pathParser.resolve(this.config.root, this.config.output.path)

      const operationGenerator = new OperationGenerator({
        oas,
        context: this,
        // TODO find better way of doing this
        typePluginName: types.output ? pluginName : swaggerTypescriptPluginName,
        fileResolverFactory: (fileName, typePluginName) => async (name) => {
          // Used when a react-query type(request, response, params) has an import of a global type
          const filePath = await this.resolveId({ fileName, directory, pluginName: typePluginName, options: { type: 'model' } })
          // refs import, will always been created with the swaggerTypescript plugin, our global type
          const resolvedTypeId = await this.resolveId({
            fileName: `${name}.ts`,
            directory,
            pluginName: swaggerTypescriptPluginName,
          })

          return getRelativePath(filePath, resolvedTypeId)
        },
      })

      await operationGenerator.build()
    },
  }
})
