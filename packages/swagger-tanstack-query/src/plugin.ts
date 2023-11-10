import path from 'node:path'
import url from 'node:url'

import { createPlugin, FileManager, PluginManager } from '@kubb/core'
import { renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { getGroupedByTagFiles } from '@kubb/swagger/utils'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbPlugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-tanstack-query' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['controller', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    output = 'hooks',
    groupBy,
    skipBy = [],
    overrideBy = [],
    framework = 'react',
    clientImportPath,
    infinite,
    transformers = {},
    dataReturnType = 'data',
  } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options: {
      framework,
      clientImportPath,
      dataReturnType,
      infinite: infinite
        ? {
          queryParam: 'id',
          initialPageParam: 0,
          ...infinite,
        }
        : undefined,
      templatesPath: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../templates'),
    },
    kind: 'controller',
    validate(plugins) {
      pluginsOptions = PluginManager.getDependedPlugins<SwaggerPluginOptions>(plugins, [swaggerPluginName])

      return true
    },
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

      if (options?.tag && groupBy?.type === 'tag') {
        const tag = camelCase(options.tag, { delimiter: '', transform: camelCaseTransformMerge })

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
      }

      return path.resolve(root, output, baseName)
    },
    resolveName(name, type) {
      let resolvedName = camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

      if (type) {
        if (framework === 'react' || framework === 'vue') {
          resolvedName = camelCase(`use ${name}`, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
        }

        if (framework === 'svelte' || framework === 'solid') {
          resolvedName = camelCase(`${name} query`, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })
        }
      }

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        this.plugin.options,
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          skipBy,
          overrideBy,
        },
      )

      const files = await operationGenerator.build()

      await this.addFile(...files)
    },
    async writeFile(source, path) {
      if (!path.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, path)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const rootFiles = getGroupedByTagFiles({
          logger: this.logger,
          files: this.fileManager.files,
          plugin: this.plugin,
          template,
          exportAs: groupBy.exportAs || '{{tag}}Hooks',
          root,
          output,
          resolveName: this.pluginManager.resolveName,
        })

        await this.addFile(...rootFiles)
      }

      await this.fileManager.addIndexes({
        root,
        extName: '.ts',
        meta: { pluginKey: this.plugin.key },
        options: {
          output,
        },
      })
    },
  }
})
