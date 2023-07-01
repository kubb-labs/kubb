import pathParser from 'node:path'

import { createPlugin, validatePlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/index.ts'

import type { API as SwaggerApi } from '@kubb/swagger'
import type { API as ZodApi } from '@kubb/swagger-zod'
import type { PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger-zodios' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-zodios']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zodios.ts' } = options
  let swaggerApi: SwaggerApi
  let zodApi: ZodApi

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName, swaggerZodPluginName])
      if (valid) {
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api as SwaggerApi
        zodApi = plugins.find((plugin) => plugin.name === swaggerZodPluginName)?.api as ZodApi
      }

      return valid
    },
    resolvePath(fileName, _directory) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, fileName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
    },
    async buildStart() {
      const oas = await swaggerApi.getOas()

      const operationGenerator = new OperationGenerator({
        oas,
        output,
        skipBy: zodApi.skipBy,
        resolvePath: (params) => this.resolvePath({ pluginName, ...params }),
        resolveName: (params) => this.resolveName({ pluginName, ...params }),
      })

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
  }
})
