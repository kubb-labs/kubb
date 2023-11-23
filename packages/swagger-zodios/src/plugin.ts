import path from 'node:path'

import { createPlugin, PluginManager } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './OperationGenerator.ts'

import type { KubbPlugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions as SwaggerZodPluginOptions } from '@kubb/swagger-zod'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-zodios' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zodios.ts' } = options

  return {
    name: pluginName,
    options,
    pre: [swaggerPluginName, swaggerZodPluginName],
    resolvePath(baseName, _directory) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, baseName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      const [swaggerPlugin, swaggerZodPlugin]: [KubbPlugin<SwaggerPluginOptions>, KubbPlugin<SwaggerZodPluginOptions>] = PluginManager.getDependedPlugins<
        SwaggerPluginOptions,
        SwaggerZodPluginOptions
      >(this.plugins, [swaggerPluginName, swaggerZodPluginName])
      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        {
          baseURL: await swaggerPlugin.api.getBaseURL(),
          output,
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          exclude: swaggerZodPlugin.options.exclude,
          include: swaggerZodPlugin.options.include,
          override: swaggerZodPlugin.options.override,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
  }
})
