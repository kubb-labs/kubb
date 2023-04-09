import pathParser from 'path'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { createPlugin, validatePlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'
import type { Api as SwaggerApi } from '@kubb/swagger'
import { writeIndexes } from '@kubb/ts-codegen'

import { OperationGenerator } from './generators'

import type { PluginOptions } from './types'

export const pluginName = 'swagger-zodios' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-zodios']: PluginOptions['options']
  }
}

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
    resolvePath(fileName, directory) {
      if (!directory) {
        return null
      }

      return pathParser.resolve(directory, fileName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', transform: camelCaseTransformMerge })
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const directory = pathParser.resolve(this.config.root, this.config.output.path)

      const operationGenerator = new OperationGenerator({
        oas,
        directory,
        output,
        fileManager: this.fileManager,
        resolveName: this.resolveName,
        resolvePath: this.resolvePath,
      })

      await operationGenerator.build()
    },
    async buildEnd() {
      if (this.config.output.write || this.config.output.write === undefined) {
        const files = await writeIndexes(this.config.root, this.config.output.path, { extensions: /\.ts/, exclude: [/schemas/, /json/] })
        files?.forEach((file) => {
          this.fileManager.addOrAppend(file)
        })
      }
    },
  }
})
