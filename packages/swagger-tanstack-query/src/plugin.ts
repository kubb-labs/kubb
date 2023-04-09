import pathParser from 'path'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import type { OptionalPath } from '@kubb/core'
import { getRelativePath, renderTemplate, createPlugin, validatePlugins, getPathMode } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi } from '@kubb/swagger'
import { print, createExportDeclaration, writeIndexes } from '@kubb/ts-codegen'

import { OperationGenerator } from './generators'

import type { PluginOptions } from './types'

export const pluginName = 'swagger-tanstack-query' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-tanstack-query']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'hooks', groupBy, framework = 'react' } = options
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
      if (!directory) {
        return null
      }

      const mode = getPathMode(pathParser.resolve(directory, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return pathParser.resolve(directory, output)
      }

      if (options?.tag && groupBy?.type === 'tag') {
        const template = groupBy.output ? groupBy.output : `${output}/{{tag}}Controller`

        const path = getRelativePath(
          pathParser.resolve(this.config.root, this.config.output.path),
          pathParser.resolve(directory, renderTemplate(template, { tag: options.tag }))
        )
        const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}Hooks', { tag: options.tag }), pluginName })

        if (name) {
          this.fileManager.addOrAppend({
            fileName: 'index.ts',
            path: `${pathParser.resolve(this.config.root, this.config.output.path)}/index.ts`,
            source: print(
              createExportDeclaration({
                path,
                asAlias: true,
                name,
              })
            ),
          })
        }

        return pathParser.resolve(directory, renderTemplate(template, { tag: options.tag }), fileName)
      }

      return pathParser.resolve(directory, output, fileName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', transform: camelCaseTransformMerge })
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const directory = pathParser.resolve(this.config.root, this.config.output.path)
      const clientPath: OptionalPath = options.client ? pathParser.resolve(this.config.root, options.client) : undefined

      const operationGenerator = new OperationGenerator({
        framework,
        clientPath,
        oas,
        directory,
        fileManager: this.fileManager,
        resolvePath: (params) => this.resolvePath({ pluginName, ...params }),
        resolveName: (params) => this.resolveName({ pluginName, ...params }),
      })

      await operationGenerator.build()
    },
    async buildEnd() {
      if (this.config.output.write || this.config.output.write === undefined) {
        const files = await writeIndexes(this.config.root, this.config.output.path, { extensions: /\.ts/, exclude: [/schemas/, /json/] })
        files?.forEach((file) => {
          this.fileManager.addOrAppend(file)
        })
      }
    },
  }
})
