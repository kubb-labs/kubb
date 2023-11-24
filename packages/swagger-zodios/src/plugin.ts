import path from 'node:path'

import { createPlugin, PluginManager } from '@kubb/core'
import { camelCase, trimExtName } from '@kubb/core/transformers'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { OperationGenerator } from './OperationGenerator.tsx'

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
    options: {
      name: trimExtName(output),
      baseURL: undefined,
    },
    pre: [swaggerPluginName, swaggerZodPluginName],
    resolvePath(baseName, _directory) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, baseName)
    },
    resolveName(name) {
      return camelCase(name)
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      const [swaggerPlugin]: [KubbPlugin<SwaggerPluginOptions>, KubbPlugin<SwaggerZodPluginOptions>] = PluginManager.getDependedPlugins<
        SwaggerPluginOptions,
        SwaggerZodPluginOptions
      >(this.plugins, [swaggerPluginName, swaggerZodPluginName])
      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        {
          name: trimExtName(output),
          baseURL: await swaggerPlugin.api.getBaseURL(),
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          exclude: undefined,
          include: undefined,
          override: undefined,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
  }
})
