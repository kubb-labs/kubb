import pathParser from 'path'

import { createPlugin, validatePlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'
import type { Api as SwaggerApi } from '@kubb/swagger'

import { OperationGenerator } from './generators'

import type { PluginOptions } from './types'

export const pluginName = 'swagger-zodios' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zodios.ts' } = options
  let swaggerApi: SwaggerApi

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName, swaggerZodPluginName])
      if (valid) {
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api
      }

      return valid
    },
    resolveId(fileName, directory) {
      if (!directory) {
        return null
      }

      return pathParser.resolve(directory, fileName)
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const directory = pathParser.resolve(this.config.root, this.config.output.path)

      const operationGenerator = new OperationGenerator({
        oas,
        directory,
        fileName: output,
        fileManager: this.fileManager,
        resolveId: this.resolveId,
      })

      await operationGenerator.build()
    },
  }
})
