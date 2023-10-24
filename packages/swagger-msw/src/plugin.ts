import path from 'node:path'

import { createPlugin, FileManager, getDependedPlugins, getRelativePath, renderTemplate } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerFakerPluginName } from '@kubb/swagger-faker'
import { pluginName as swaggerTypeScriptPluginName } from '@kubb/swagger-ts'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/index.ts'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export const pluginName = 'swagger-msw' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['schema', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'handlers', groupBy, skipBy = [], overrideBy = [], transformers = {} } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options,
    kind: 'schema',
    validate(plugins) {
      pluginsOptions = getDependedPlugins<SwaggerPluginOptions>(plugins, [swaggerPluginName, swaggerTypeScriptPluginName, swaggerFakerPluginName])

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
    resolveName(name) {
      const resolvedName = camelCase(`${name} Handler`, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        {},
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
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const filteredFiles = this.fileManager.files.filter(
          (file) => file.meta?.pluginKey?.[1] === pluginName && (file.meta as FileMeta)?.tag,
        ) as KubbFile.File<FileMeta>[]
        const rootFiles = filteredFiles
          .map((file) => {
            const tag = file.meta?.tag && camelCase(file.meta.tag, { delimiter: '', transform: camelCaseTransformMerge })
            const tagPath = getRelativePath(path.resolve(root, output), path.resolve(root, renderTemplate(template, { tag })))
            const tagName = camelCase(renderTemplate(groupBy.exportAs || '{{tag}}Handlers', { tag }), {
              delimiter: '',
              transform: camelCaseTransformMerge,
            })

            if (tagName) {
              return {
                baseName: 'index.ts' as const,
                path: path.resolve(root, output, 'index.ts'),
                source: '',
                exports: [{ path: tagPath, asAlias: true, name: tagName }],
                meta: {
                  pluginKey: this.plugin.key,
                },
              }
            }
          })
          .filter(Boolean)

        await this.addFile(...rootFiles)
      }

      await this.fileManager.addIndexes({ root, extName: '.ts', meta: { pluginKey: this.plugin.key } })
    },
  }
})
