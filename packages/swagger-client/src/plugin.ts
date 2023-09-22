import pathParser from 'node:path'

import { createPlugin, getLocation, getPathMode, getRelativePath, read, renderTemplate, getDependedPlugins, getIndexes } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase } from 'case-anything'

import { OperationGenerator } from './generators/OperationGenerator.ts'

import type { OptionalPath, File } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'
import type { FileMeta } from './types'

export const pluginName: PluginOptions['name'] = 'swagger-client' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'clients', groupBy, skipBy = [], transformers = {} } = options
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
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const clientPath = pathParser.resolve(root, 'client.ts')

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
      const [swaggerPlugin] = pluginsOptions
      const root = pathParser.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const filteredFiles = this.fileManager.files.filter((file) => file.meta?.pluginName === pluginName && (file.meta as FileMeta)?.tag) as File<FileMeta>[]
        const rootFiles = filteredFiles
          .map((file) => {
            const tag = file.meta?.tag && camelCase(file.meta.tag)
            const path = getRelativePath(pathParser.resolve(root, output), pathParser.resolve(root, renderTemplate(template, { tag })))
            const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}Service', { tag }), pluginName })

            if (name) {
              return {
                fileName: 'index.ts',
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
        const originalClientPath: OptionalPath = options.client
          ? pathParser.resolve(this.config.root, options.client)
          : getLocation('@kubb/swagger-client/ts-client', process.cwd())

        if (!originalClientPath) {
          throw new Error(
            `Cannot find the 'client.ts' file, or 'client' is not set in the options or '@kubb/swagger-client' is not included in your dependencies`,
          )
        }

        const baseURL = await swaggerPlugin.api.getBaseURL()

        await this.addFile({
          fileName: 'client.ts',
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
