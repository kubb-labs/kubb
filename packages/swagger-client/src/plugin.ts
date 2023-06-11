import pathParser from 'node:path'

import { createPlugin, getLocation, getPathMode, getRelativePath, importModule, read, renderTemplate, validatePlugins, writeIndexes } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/OperationGenerator.ts'

import type { OptionalPath } from '@kubb/core'
import type { API as SwaggerApi } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-client' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-client']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'clients', groupBy } = options
  let swaggerApi: SwaggerApi

  return {
    name: pluginName,
    options,
    kind: 'controller',
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName])
      if (valid) {
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api
      }

      return valid
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
        const template = groupBy.output ? groupBy.output : `${output}/{{tag}}Controller`

        const path = getRelativePath(pathParser.resolve(root, output), pathParser.resolve(root, renderTemplate(template, { tag: options.tag })))
        const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}Service', { tag: options.tag }), pluginName })

        if (name) {
          this.fileManager.addOrAppend({
            fileName: 'index.ts',
            path: pathParser.resolve(this.config.root, this.config.output.path, output, 'index.ts'),
            source: '',
            exports: [{ path, asAlias: true, name }],
          })
        }

        return pathParser.resolve(root, renderTemplate(template, { tag: options.tag }), fileName)
      }

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', transform: camelCaseTransformMerge })
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const clientPath = this.resolvePath({ pluginName, fileName: 'client.ts' })

      const operationGenerator = new OperationGenerator({
        clientPath,
        oas,
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
      const files = await writeIndexes(root, { extensions: /\.ts/, exclude: [/schemas/, /json/] })

      if (files) {
        await this.addFile(...files)
      }

      // copy `client.ts`
      const clientPath = this.resolvePath({ pluginName, fileName: 'client.ts' })

      if (clientPath) {
        const originalClientPath: OptionalPath = options.client
          ? pathParser.resolve(this.config.root, options.client)
          : getLocation('@kubb/swagger-client/ts-client', process.cwd())

        if (!originalClientPath) {
          throw new Error(
            `Cannot find the 'client.ts' file, or 'client' is not set in the options or '@kubb/swagger-client' is not included in your dependencies`
          )
        }

        const baseURL = swaggerApi.getBaseURL()

        await this.addFile({
          fileName: 'client.ts',
          path: clientPath,
          source: await read(originalClientPath),
          env: {
            AXIOS_BASE: baseURL ? `'${baseURL}'` : undefined,
          },
        })
      }
    },
  }
})
