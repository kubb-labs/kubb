import pathParser from 'node:path'

import { createPlugin, getDependedPlugins, getPathMode, getRelativePath, renderTemplate } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerTypeScriptPluginName } from '@kubb/swagger-ts'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { FakerBuilder } from './builders/index.ts'
import { OperationGenerator } from './generators/index.ts'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { OpenAPIV3, PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export const pluginName = 'swagger-faker' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['schema', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'mocks', groupBy, skipBy = [], overrideBy = [], transformers = {}, dateType = 'string' } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options,
    kind: 'schema',
    validate(plugins) {
      pluginsOptions = getDependedPlugins<SwaggerPluginOptions>(plugins, [swaggerPluginName, swaggerTypeScriptPluginName])

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
      const resolvedName = camelCase(`create ${name}`, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

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
        const builder = await new FakerBuilder({
          resolveName: (params) => this.resolveName({ pluginKey: this.plugin.key, ...params }),
          fileResolver: (name, ref) => {
            const resolvedTypeId = this.resolvePath({
              baseName: `${name}.ts`,
              pluginKey: ref.pluginKey || this.plugin.key,
            })

            const root = this.resolvePath({ baseName: ref.pluginKey ? `${name}.ts` : ``, pluginKey: this.plugin.key })

            return getRelativePath(root, resolvedTypeId)
          },
          withJSDocs: true,
          dateType,
        }).configure()

        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const mapFolderSchema = async ([name]: [string, OpenAPIV3.SchemaObject]) => {
          const path = this.resolvePath({ baseName: `${this.resolveName({ name, pluginKey })}.ts`, pluginKey })

          if (!path) {
            return null
          }

          return this.addFile({
            path,
            baseName: `${this.resolveName({ name, pluginKey })}.ts`,
            source: builder.print(name),
            imports: [
              {
                name: ['faker'],
                path: '@faker-js/faker',
              },
            ],
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
        const builder = new FakerBuilder({
          resolveName: (params) => this.resolveName({ pluginKey: this.plugin.key, ...params }),
          withJSDocs: true,
          dateType,
        }).configure()
        const mapFileSchema = ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        }

        Object.entries(schemas).map(mapFileSchema)
        const path = this.resolvePath({ baseName: '', pluginKey: this.plugin.key })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          baseName: `${this.resolveName({ name: output, pluginKey: this.plugin.key })}.ts`,
          source: builder.print(),
          imports: [
            {
              name: ['faker'],
              path: '@faker-js/faker',
            },
          ],
          meta: {
            pluginKey: this.plugin.key,
          },
        })
      }

      const operationGenerator = new OperationGenerator(
        {
          mode,
          dateType,
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

      if (groupBy?.type === 'tag') {
        const filteredFiles = this.fileManager.files.filter(
          (file) => file.meta?.pluginKey?.[1] === pluginName && (file.meta as FileMeta)?.tag,
        ) as KubbFile.File<FileMeta>[]
        const rootFiles = filteredFiles
          .map((file) => {
            const tag = file.meta?.tag && camelCase(file.meta.tag, { delimiter: '', transform: camelCaseTransformMerge })
            const path = getRelativePath(pathParser.resolve(root, output), pathParser.resolve(root, renderTemplate(template, { tag })))
            const name = camelCase(renderTemplate(groupBy.exportAs || '{{tag}}Mocks', { tag }), {
              delimiter: '',
              transform: camelCaseTransformMerge,
            })

            if (name) {
              return {
                baseName: 'index.ts' as const,
                path: pathParser.resolve(root, output, 'index.ts'),
                source: '',
                exports: [{ path, asAlias: true, name }],
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
