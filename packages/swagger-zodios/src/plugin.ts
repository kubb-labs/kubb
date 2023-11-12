import pathParser from 'node:path'

import { createPlugin, getDependedPlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/index.ts'

import type { KubbPlugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions as SwaggerZodPluginOptions } from '@kubb/swagger-zod'
import type { PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger-zodios' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zodios.ts' } = options
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>, KubbPlugin<SwaggerZodPluginOptions>]

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      pluginsOptions = getDependedPlugins<SwaggerPluginOptions, SwaggerZodPluginOptions>(plugins, [swaggerPluginName, swaggerZodPluginName])

      return true
    },
    resolvePath(baseName, _directory) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, baseName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
    },
    async buildStart() {
      const [swaggerPlugin, swaggerZodPlugin] = pluginsOptions
      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        {
          baseURL: await swaggerPlugin.api.getBaseURL(),
          output,
        },
        {
          oas,
          pluginManager: this.pluginManager,
          contentType: swaggerPlugin.api.contentType,
          skipBy: swaggerZodPlugin.options.skipBy,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
  }
})
