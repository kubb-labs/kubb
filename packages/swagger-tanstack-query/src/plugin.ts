import pathParser from 'node:path'

import { createPlugin, getPathMode, getRelativePath, renderTemplate, validatePlugins, writeIndexes } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/index.ts'

import type { OptionalPath } from '@kubb/core'
import type { API as SwaggerApi } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger-tanstack-query' as const

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
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api as SwaggerApi
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
        const tag = camelCase(options.tag, { delimiter: '', transform: camelCaseTransformMerge })

        const path = getRelativePath(pathParser.resolve(root, output), pathParser.resolve(root, renderTemplate(template, { tag })))
        const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}Hooks', { tag }), pluginName })

        if (name) {
          this.fileManager.addOrAppend({
            fileName: 'index.ts',
            path: pathParser.resolve(this.config.root, this.config.output.path, output, 'index.ts'),
            source: '',
            exports: [{ path, asAlias: true, name }],
          })
        }

        return pathParser.resolve(root, renderTemplate(template, { tag }), fileName)
      }

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      return camelCase(name, { delimiter: '', transform: camelCaseTransformMerge })
    },
    async buildStart() {
      const oas = await swaggerApi.getOas()
      const clientPath: OptionalPath = options.client ? pathParser.resolve(this.config.root, options.client) : undefined

      const operationGenerator = new OperationGenerator({
        framework,
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
    },
  }
})
