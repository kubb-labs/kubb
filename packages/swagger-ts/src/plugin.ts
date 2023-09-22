import pathParser from 'node:path'

import { createPlugin, getPathMode, getRelativePath, renderTemplate, getDependedPlugins, getIndexes, timeout } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, pascalCase } from 'case-anything'

import { TypeBuilder } from './builders/index.ts'
import { OperationGenerator } from './generators/index.ts'

import type { OpenAPIV3 } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'

export const pluginName: PluginOptions['name'] = 'swagger-ts' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'models', groupBy, skipBy = [], enumType = 'asConst', dateType = 'string', optionalType = 'questionToken', transformers = {} } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [SwaggerPluginOptions]

  return {
    name: pluginName,
    options,
    kind: 'schema',
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
      const resolvedName = pascalCase(name)

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async writeFile(source, path) {
      if (!path.endsWith('.ts') || !source) {
        return
      }

      await this.fileManager.write(source, path)
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()

      const schemas = await swaggerPlugin.api.getSchemas()
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const mode = getPathMode(pathParser.resolve(root, output))

      if (mode === 'directory') {
        const builder = await new TypeBuilder(oas).configure({
          resolveName: (params) => this.resolveName({ pluginName, ...params }),
          fileResolver: (name) => {
            const resolvedTypeId = this.resolvePath({
              fileName: `${name}.ts`,
              pluginName,
            })

            const root = this.resolvePath({ fileName: ``, pluginName })

            return getRelativePath(root, resolvedTypeId)
          },
          withJSDocs: true,
          enumType,
          dateType,
          optionalType,
        })
        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const mapFolderSchema = async ([name]: [string, OpenAPIV3.SchemaObject]) => {
          const path = this.resolvePath({ fileName: `${this.resolveName({ name, pluginName })}.ts`, pluginName })

          if (!path) {
            return null
          }

          return this.addFile({
            path,
            fileName: `${this.resolveName({ name, pluginName })}.ts`,
            source: builder.print(name),
            meta: {
              pluginName,
            },
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        // outside the loop because we need to add files to just one instance to have the correct sorting, see refsSorter
        const builder = new TypeBuilder(oas).configure({
          resolveName: (params) => this.resolveName({ pluginName, ...params }),
          withJSDocs: true,
          enumType,
          dateType,
          optionalType,
        })
        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const path = this.resolvePath({ fileName: '', pluginName })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          fileName: `${this.resolveName({ name: output, pluginName })}.ts`,
          source: builder.print(),
          meta: {
            pluginName,
          },
        })
      }

      const operationGenerator = new OperationGenerator({
        contentType: swaggerPlugin.api.contentType,
        oas,
        skipBy,
        mode,
        resolvePath: (params) => this.resolvePath({ pluginName, ...params }),
        resolveName: (params) => this.resolveName({ pluginName, ...params }),
        enumType,
        dateType,
        optionalType,
      })

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      while (this.fileManager.isExecuting) {
        await timeout(100)
      }

      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const files = await getIndexes(root, { extensions: /\.ts/, exclude: [/schemas/, /json/] })

      if (files) {
        await this.addFile(...files)
      }
    },
  }
})
