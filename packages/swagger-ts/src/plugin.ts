import pathParser from 'node:path'

import { createPlugin, getDependedPlugins, getPathMode, getRelativePath, renderTemplate } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, camelCaseTransformMerge, pascalCase, pascalCaseTransformMerge } from 'change-case'

import { TypeBuilder } from './builders/index.ts'
import { OperationGenerator } from './generators/index.ts'

import type { KubbPlugin } from '@kubb/core'
import type { OpenAPIV3, PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-ts' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['schema', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    output = 'types',
    groupBy,
    skipBy = [],
    overrideBy = [],
    enumType = 'asConst',
    dateType = 'string',
    optionalType = 'questionToken',
    transformers = {},
    exportAs,
  } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options,
    kind: 'schema',
    validate(plugins) {
      pluginsOptions = getDependedPlugins<SwaggerPluginOptions>(plugins, [swaggerPluginName])

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
      const resolvedName = pascalCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: pascalCaseTransformMerge })

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async writeFile(source, path) {
      if (!path.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, path)
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()

      const schemas = await swaggerPlugin.api.getSchemas()
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const mode = getPathMode(pathParser.resolve(root, output))
      // keep the used enumnames between TypeBuilder and OperationGenerator per plugin(pluginKey)
      const usedEnumNames = {}

      if (mode === 'directory') {
        const builder = await new TypeBuilder({
          usedEnumNames,
          resolveName: (params) => this.resolveName({ pluginKey: this.plugin.key, ...params }),
          fileResolver: (name) => {
            const resolvedTypeId = this.resolvePath({
              baseName: `${name}.ts`,
              pluginKey: this.plugin.key,
            })

            const root = this.resolvePath({ baseName: ``, pluginKey: this.plugin.key })

            return getRelativePath(root, resolvedTypeId)
          },
          withJSDocs: true,
          enumType,
          dateType,
          optionalType,
        }).configure()
        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const mapFolderSchema = async ([name]: [string, OpenAPIV3.SchemaObject]) => {
          const path = this.resolvePath({ baseName: `${this.resolveName({ name, pluginKey: this.plugin.key })}.ts`, pluginKey: this.plugin.key })

          if (!path) {
            return null
          }

          return this.addFile({
            path,
            baseName: `${this.resolveName({ name, pluginKey: this.plugin.key })}.ts`,
            source: builder.print(name),
            meta: {
              pluginKey: this.plugin.key,
            },
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        // outside the loop because we need to add files to just one instance to have the correct sorting, see refsSorter
        const builder = new TypeBuilder({
          usedEnumNames,
          resolveName: (params) => this.resolveName({ pluginKey: this.plugin.key, ...params }),
          withJSDocs: true,
          enumType,
          dateType,
          optionalType,
        }).configure()
        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const path = this.resolvePath({ baseName: '', pluginKey: this.plugin.key })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          baseName: `${this.resolveName({ name: output, pluginKey: this.plugin.key })}.ts`,
          source: builder.print(),
          meta: {
            pluginKey: this.plugin.key,
          },
        })
      }

      const operationGenerator = new OperationGenerator(
        {
          mode,
          enumType,
          dateType,
          optionalType,
          usedEnumNames,
        },
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

      const root = pathParser.resolve(this.config.root, this.config.output.path)

      await this.fileManager.addIndexes({
        root,
        extName: '.ts',
        meta: { pluginKey: this.plugin.key },
        options: {
          map: (file) => {
            return {
              ...file,
              exports: file.exports?.map(item => {
                if (exportAs) {
                  return {
                    ...item,
                    name: exportAs,
                    asAlias: !!exportAs,
                  }
                }
                return item
              }),
            }
          },
          output,
          isTypeOnly: true,
        },
      })
    },
  }
})
