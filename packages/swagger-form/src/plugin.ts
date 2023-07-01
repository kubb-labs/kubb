import pathParser from 'node:path'

import type { File } from '@kubb/core'
import { createPlugin, getPathMode, getRelativePath, renderTemplate, validatePlugins, getIndexes, isExtensionAllowed } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { pascalCase, pascalCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './generators/index.ts'

import type { API as SwaggerApi } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger-form' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-form']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'forms', groupBy, skipBy = [], withDevtools = false, overrides } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
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
        const tag = pascalCase(options.tag, { delimiter: '', transform: pascalCaseTransformMerge })

        return pathParser.resolve(root, renderTemplate(template, { tag }), fileName)
      }

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      return pascalCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: pascalCaseTransformMerge })
    },
    async writeFile(source, path) {
      if (!isExtensionAllowed(path) || !source) {
        return
      }

      await this.fileManager.write(source, path)
    },
    async buildStart() {
      const oas = await swaggerApi.getOas()
      // needed so we have the full object instead of a ref(form cannot work with refs)
      await oas.dereference()

      const operationGenerator = new OperationGenerator({
        oas,
        skipBy,
        resolvePath: (params) => this.resolvePath({ pluginName, ...params }),
        resolveName: (params) => this.resolveName({ pluginName, ...params }),
        withDevtools,
        overrides,
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
            const tag = file.meta?.tag && pascalCase(file.meta.tag, { delimiter: '', transform: pascalCaseTransformMerge })
            const path = getRelativePath(pathParser.resolve(root, output), pathParser.resolve(root, renderTemplate(template, { tag })))
            const name = this.resolveName({ name: renderTemplate(groupBy.exportAs || '{{tag}}Forms', { tag }), pluginName })

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

      const files = await getIndexes(root, { extensions: /\.ts/, exclude: [/schemas/, /json/] })

      if (files) {
        await this.addFile(...files)
      }
    },
  }
})
