import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase, trimExtName } from '@kubb/core/transformers'
import { pluginSwaggerName } from '@kubb/swagger'
import { pluginZodName } from '@kubb/swagger-zod'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { Override, PluginSwagger } from '@kubb/swagger'
import type { PluginZod } from '@kubb/swagger-zod'
import type { PluginZodios } from './types.ts'

export const pluginZodiosName = 'plugin-zodios' satisfies PluginZodios['name']

export const pluginZodios = createPlugin<PluginZodios>((options) => {
  const { output = { path: 'zodios.ts' } } = options

  return {
    name: pluginZodiosName,
    options: {
      name: trimExtName(output.path),
      baseURL: undefined,
    },
    pre: [pluginSwaggerName, pluginZodName],
    resolvePath(baseName) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, baseName)
    },
    resolveName(name, type) {
      return camelCase(name, { isFile: type === 'file' })
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath, { sanity: false })
    },
    async buildStart() {
      const [swaggerPlugin, swaggerZodPlugin]: [Plugin<PluginSwagger>, Plugin<PluginZod>] = PluginManager.getDependedPlugins<PluginSwagger, PluginZod>(
        this.plugins,
        [pluginSwaggerName, pluginZodName],
      )
      const oas = await swaggerPlugin.api.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))

      const operationGenerator = new OperationGenerator(
        {
          name: trimExtName(output.path),
          baseURL: await swaggerPlugin.api.getBaseURL(),
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          exclude: swaggerZodPlugin.options.exclude,
          include: swaggerZodPlugin.options.include,
          override: swaggerZodPlugin.options.override as Override<unknown>[],
          mode,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
  }
})
