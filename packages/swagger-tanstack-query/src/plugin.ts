import pathParser from 'path'

import { camelCase } from 'change-case'

import type { OptionalPath } from '@kubb/core'
import { createPlugin, validatePlugins, getPathMode } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi } from '@kubb/swagger'

import { OperationGenerator } from './generators'

import type { PluginOptions } from './types'

export const pluginName = 'swagger-tanstack-query' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'hooks', groupBy, framework = 'react' } = options
  let swaggerApi: SwaggerApi

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName])
      if (valid) {
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api
      }

      return valid
    },
    resolveId(fileName, directory, options) {
      if (!directory) {
        return null
      }

      const mode = getPathMode(pathParser.resolve(directory, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return pathParser.resolve(directory, output)
      }

      if (options?.tag && groupBy === 'tag') {
        return pathParser.resolve(directory, output, camelCase(`${options.tag}Controller`), fileName)
      }

      return pathParser.resolve(directory, output, fileName)
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const directory = pathParser.resolve(this.config.root, this.config.output.path)
      const clientPath: OptionalPath = options.client ? pathParser.resolve(this.config.root, options.client) : undefined

      const operationGenerator = new OperationGenerator({
        framework,
        clientPath,
        oas,
        directory,
        fileManager: this.fileManager,
        resolveId: this.resolveId,
      })

      await operationGenerator.build()
    },
  }
})
