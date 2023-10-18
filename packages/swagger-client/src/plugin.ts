import pathParser from 'node:path'

import { createPlugin, getDependedPlugins, getIndexes, getLocation, getPathMode, getRelativePath, read, renderTemplate } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/OperationGenerator.ts'

import type { KubbFile } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger-client' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'clients', groupBy, skipBy = [], transformers = {}, dataReturnType = 'data' } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [SwaggerPluginOptions]

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      pluginsOptions = getDependedPlugins<[SwaggerPluginOptions]>(plugins, [swaggerPluginName])

      return true
    },
    resolvePath(baseName, directory, options) {
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
        const tag = camelCase(options.tag, { delimiter: '', transform: camelCaseTransformMerge })

        return pathParser.resolve(root, renderTemplate(template, { tag }), baseName)
      }

      return pathParser.resolve(root, output, baseName)
    },
    resolveName(name) {
      const resolvedName = camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const clientPath = pathParser.resolve(root, 'client.ts')

      const operationGenerator = new OperationGenerator({
        pluginManager: this.pluginManager,
        contentType: swaggerPlugin.api.contentType,
        dataReturnType,
        clientPath,
        clientImportPath: options.clientImportPath,
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
      const [swaggerPlugin] = pluginsOptions
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const filteredFiles = this.fileManager.files.filter(
          (file) => file.meta?.pluginName === pluginName && (file.meta as FileMeta)?.tag,
        ) as KubbFile.File<FileMeta>[]
        const rootFiles = filteredFiles
          .map((file) => {
            const tag = file.meta?.tag && camelCase(file.meta.tag, { delimiter: '', transform: camelCaseTransformMerge })
            const path = getRelativePath(pathParser.resolve(root, output), pathParser.resolve(root, renderTemplate(template, { tag })))
            const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}Service', { tag }), pluginName })

            if (name) {
              return {
                baseName: 'index.ts' as const,
                path: pathParser.resolve(this.config.root, this.config.output.path, output, 'index.ts'),
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

      // copy `client.ts`
      const clientPath = pathParser.resolve(root, 'client.ts')

      if (clientPath) {
        const originalClientPath: KubbFile.OptionalPath = options.client
          ? pathParser.resolve(this.config.root, options.client)
          : getLocation('@kubb/swagger-client/ts-client', process.cwd())

        if (!originalClientPath) {
          throw new Error(
            `Cannot find the 'client.ts' file, or 'client' is not set in the options or '@kubb/swagger-client' is not included in your dependencies`,
          )
        }

        const baseURL = await swaggerPlugin.api.getBaseURL()

        await this.addFile({
          baseName: 'client.ts',
          path: clientPath,
          source: await read(originalClientPath),
          env: {
            AXIOS_BASE: baseURL,
            AXIOS_HEADERS: JSON.stringify({}),
          },
        })
      }

      const files = await getIndexes(root, { extensions: /\.ts/, exclude: [/schemas/, /json/] })

      if (files) {
        await this.addFile(...files)
      }
    },
  }
})
