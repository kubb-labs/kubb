import pathParser from 'path'

import { camelCase } from 'change-case'

import { createPlugin, validatePlugins, getPathMode, read } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi } from '@kubb/swagger'

import { OperationGenerator } from './generators'

import type { PluginOptions } from './types'
import { OptionalPath } from '@kubb/core'

export const pluginName = 'swagger-react-query' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'hooks', groupBy } = options
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
      const client = options.client && (await read(pathParser.resolve(this.config.root, options.client)))
      let clientPath: OptionalPath

      if (client) {
        clientPath = await this.resolveId({
          fileName: `client.ts`,
          directory: pathParser.resolve(this.config.root, this.config.output.path),
        })

        if (clientPath) {
          await this.addFile({
            path: clientPath,
            fileName: `client.ts`,
            source: client.replace('./src/types', '@kubb/swagger-react-query'),
          })
        }
      }

      const operationGenerator = new OperationGenerator({
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
