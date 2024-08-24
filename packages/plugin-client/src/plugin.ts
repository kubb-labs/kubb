import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { getGroupedByTagFiles } from '@kubb/plugin-oas/utils'

import { clientParser } from './OperationGenerator.tsx'
import { Client, Operations } from './components/index.ts'

import type { Plugin } from '@kubb/core'
import type { PluginOas as SwaggerPluginOptions } from '@kubb/plugin-oas'
import type { PluginClient } from './types.ts'

export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

export const pluginClient = createPlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    dataReturnType = 'data',
    pathParamsType = 'inline',
    templates,
  } = options

  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginClientName,
    options: {
      extName: output.extName,
      dataReturnType,
      client: {
        importPath: '@kubb/plugin-client/client',
        ...options.client,
      },
      pathParamsType,
      templates: {
        operations: Operations.templates,
        client: Client.templates,
        ...templates,
      },
      baseURL: undefined,
    },
    pre: [pluginOasName],
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (options?.tag && group?.type === 'tag') {
        const tag = camelCase(options.tag)

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
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
    async writeFile(path, source) {
      if (!source) {
        return
      }

      return this.fileManager.write(path, source, { sanity: false })
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [pluginOasName])

      //simplify this context in buildStart, options, ...

      const oas = await swaggerPlugin.api.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))
      const baseURL = await swaggerPlugin.api.getBaseURL()

      const operationGenerator = new OperationGenerator(
        {
          ...this.plugin.options,
          baseURL,
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          exclude,
          include,
          override,
          mode,
        },
      )

      const files = await operationGenerator.build(clientParser)

      await this.addFile(...files)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (group?.type === 'tag') {
        const rootFiles = await getGroupedByTagFiles({
          logger: this.logger,
          files: this.fileManager.files,
          plugin: this.plugin,
          template,
          exportAs: group.exportAs || '{{tag}}Service',
          root,
          output,
        })

        await this.addFile(...rootFiles)
      }

      await this.fileManager.addIndexes({
        root,
        output,
        meta: { pluginKey: this.plugin.key },
        logger: this.logger,
      })
    },
  }
})
