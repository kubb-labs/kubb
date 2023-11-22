import path from 'node:path'

import { createPlugin, FileManager, PluginManager } from '@kubb/core'
import { renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { getGroupedByTagFiles } from '@kubb/swagger/utils'

import { camelCase, camelCaseTransformMerge, pascalCase, pascalCaseTransformMerge } from 'change-case'

import { Mutation, Query, QueryOptions } from './components/index.ts'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbPlugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-swr' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    output = 'hooks',
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    templates,
    dataReturnType = 'data',
    clientImportPath = '@kubb/swagger-client/client',
  } = options
  const template = group?.output ? group.output : `${output}/{{tag}}SWRController`

  return {
    name: pluginName,
    options: {
      templates: {
        mutation: Mutation.templates,
        query: Query.templates,
        queryOptions: QueryOptions.templates,
        ...templates,
      },
      clientImportPath,
      dataReturnType,
    },
    pre: [swaggerPluginName],
    resolvePath(baseName, directory, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output)
      }

      if (options?.tag && group?.type === 'tag') {
        const tag = camelCase(options.tag, { delimiter: '', transform: camelCaseTransformMerge })

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
      }

      return path.resolve(root, output, baseName)
    },
    resolveName(name, type) {
      let resolvedName = camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

      if (type === 'file' || type === 'function') {
        resolvedName = camelCase(`use ${name}`, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
      }

      if (type === 'type') {
        resolvedName = pascalCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: pascalCaseTransformMerge })
      }

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async buildStart() {
      const [swaggerPlugin]: [KubbPlugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [swaggerPluginName])

      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        this.plugin.options,
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          exclude,
          include,
          override,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (group?.type === 'tag') {
        const rootFiles = getGroupedByTagFiles({
          logger: this.logger,
          files: this.fileManager.files,
          plugin: this.plugin,
          template,
          exportAs: group.exportAs || '{{tag}}SWRHooks',
          root,
          output,
        })

        await this.addFile(...rootFiles)
      }

      await this.fileManager.addIndexes({ root, extName: '.ts', meta: { pluginKey: this.plugin.key } })
    },
  }
})
