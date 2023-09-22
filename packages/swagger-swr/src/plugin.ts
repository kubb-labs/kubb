import pathParser from 'node:path'

import { createPlugin, getPathMode, getRelativePath, renderTemplate, getDependedPlugins, getIndexes } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase } from 'case-anything'

import { OperationGenerator } from './generators/index.ts'

import type { OptionalPath, File } from '@kubb/core'
import type { PluginOptions } from './types.ts'
import type { FileMeta } from './types.ts'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'

export const pluginName: PluginOptions['name'] = 'swagger-swr' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'hooks', groupBy, skipBy = [], transformers = {} } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}SWRController`
  let pluginsOptions: [SwaggerPluginOptions]

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      pluginsOptions = getDependedPlugins<[SwaggerPluginOptions]>(plugins, [swaggerPluginName])

      return true
    },
    resolvePath(fileName, directory, options) {
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const mode = getPathMode(pathParser.resolve(root, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return pathParser.resolve(root, output)
      }

      if (options?.tag && groupBy?.type === 'tag') {
        const tag = camelCase(options.tag)

        return pathParser.resolve(root, renderTemplate(template, { tag }), fileName)
      }

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      const resolvedName = camelCase(name)

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()

      const clientPath: OptionalPath = options.client ? pathParser.resolve(this.config.root, options.client) : undefined

      const operationGenerator = new OperationGenerator({
        contentType: swaggerPlugin.api.contentType,
        clientPath,
        oas,
        skipBy,
        resolvePath: (params) => this.resolvePath({ pluginName, ...params }),
        resolveName: (params) => this.resolveName({ pluginName, ...params }),
      })

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = pathParser.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const filteredFiles = this.fileManager.files.filter((file) => file.meta?.pluginName === pluginName && (file.meta as FileMeta)?.tag) as File<FileMeta>[]
        const rootFiles = filteredFiles
          .map((file) => {
            const tag = file.meta?.tag && camelCase(file.meta.tag)
            const path = getRelativePath(
              pathParser.resolve(this.config.root, this.config.output.path),
              pathParser.resolve(root, renderTemplate(template, { tag })),
            )
            const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}SWRHooks', { tag }), pluginName })

            if (name) {
              return {
                fileName: 'index.ts',
                path: pathParser.resolve(this.config.root, this.config.output.path, 'index.ts'),
                source: '',
                exports: [{ path, asAlias: true, name }],
                meta: {
                  pluginName,
                },
              }
            }
          })
          .filter(Boolean)

        await this.addFile(...rootFiles)
      }

      const files = await getIndexes(root, { extensions: /\.ts/, exclude: [/schemas/, /json/] })

      if (files) {
        await this.addFile(...files)
      }
    },
  }
})
