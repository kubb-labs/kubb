import path from 'node:path'

import { FileManager, type Group, PluginManager, createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'

import type { Plugin } from '@kubb/core'
import type { PluginOas as SwaggerPluginOptions } from '@kubb/plugin-oas'
import { pluginZodName } from '@kubb/plugin-zod'
import { operationsGenerator } from './generators'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import type { PluginClient } from './types.ts'

export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

export const pluginClient = createPlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    dataReturnType = 'data',
    pathParamsType = 'inline',
    paramsType = 'inline',
    operations = false,
    generators = [clientGenerator, group ? groupedClientGenerator : undefined, operations ? operationsGenerator : undefined].filter(Boolean),
    importPath = '@kubb/plugin-client/client',
    parser = 'client',
  } = options

  return {
    name: pluginClientName,
    options: {
      output,
      group,
      parser,
      dataReturnType,
      importPath,
      paramsType,
      pathParamsType: paramsType === 'object' ? 'object' : pathParamsType,
      baseURL: undefined,
    },
    pre: [pluginOasName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (options?.tag && group?.type === 'tag') {
        const groupName: Group['name'] = group?.name ? group.name : (ctx) => `${ctx.group}Controller`

        return path.resolve(root, output.path, groupName({ group: camelCase(options.tag) }), baseName)
      }

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      const resolvedName = camelCase(name, { isFile: type === 'file' })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [pluginOasName])

      const oas = await swaggerPlugin.context.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))
      const baseURL = await swaggerPlugin.context.getBaseURL()

      const operationGenerator = new OperationGenerator(
        {
          ...this.plugin.options,
          baseURL,
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.context.contentType,
          exclude,
          include,
          override,
          mode,
        },
      )

      const files = await operationGenerator.build(...generators)

      await this.addFile(...files)

      const barrelFiles = await this.fileManager.getBarrelFiles({
        type: output.barrelType ?? 'named',
        root,
        output,
        files: this.fileManager.files,
        meta: {
          pluginKey: this.plugin.key,
        },
        logger: this.logger,
      })

      await this.addFile(...barrelFiles)
    },
  }
})
