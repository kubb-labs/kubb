import path from 'node:path'

import { createPlugin, FileManager, PluginManager } from '@kubb/core'
import { getRelativePath, renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { ZodBuilder } from './builders/index.ts'
import { OperationGenerator } from './generators/index.ts'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { OpenAPIV3, PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export const pluginName = 'swagger-zod' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['schema', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zod', groupBy, skipBy = [], overrideBy = [], transformers = {} } = options
  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options,
    kind: 'schema',
    validate(plugins) {
      pluginsOptions = PluginManager.getDependedPlugins<SwaggerPluginOptions>(plugins, [swaggerPluginName])

      return true
    },
    resolvePath(baseName, directory, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output)
      }

      if (options?.tag && groupBy?.type === 'tag') {
        const tag = camelCase(options.tag, { delimiter: '', transform: camelCaseTransformMerge })

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
      }

      return path.resolve(root, output, baseName)
    },
    resolveName(name) {
      const resolvedName = camelCase(`${name}Schema`, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()
      const schemas = await swaggerPlugin.api.getSchemas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output))

      if (mode === 'directory') {
        const builder = await new ZodBuilder({
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
        }).configure()

        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const mapFolderSchema = async ([name]: [string, OpenAPIV3.SchemaObject]) => {
          const resolvedPath = this.resolvePath({ baseName: `${this.resolveName({ name, pluginKey: this.plugin.key })}.ts`, pluginKey: this.plugin.key })

          if (!resolvedPath) {
            return null
          }

          return this.addFile({
            path: resolvedPath,
            baseName: `${this.resolveName({ name, pluginKey: this.plugin.key })}.ts`,
            source: builder.print(name),
            imports: [
              {
                name: ['z'],
                path: 'zod',
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
        const builder = new ZodBuilder({
          resolveName: (params) => this.resolveName({ pluginKey: this.plugin.key, ...params }),
          withJSDocs: true,
        }).configure()
        const mapFileSchema = ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        }

        Object.entries(schemas).map(mapFileSchema)
        const resolvedPath = this.resolvePath({ baseName: '', pluginKey: this.plugin.key })
        if (!resolvedPath) {
          return
        }

        await this.addFile({
          path: resolvedPath,
          baseName: output as KubbFile.BaseName,
          source: builder.print(),
          imports: [
            {
              name: ['z'],
              path: 'zod',
            },
          ],
          meta: {
            pluginKey: this.plugin.key,
          },
          validate: false,
        })
      }

      const operationGenerator = new OperationGenerator(
        {},
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          skipBy,
          overrideBy,
          mode,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const filteredFiles = this.fileManager.files.filter(
          (file) => file.meta?.pluginKey?.[1] === pluginName && (file.meta as FileMeta)?.tag,
        ) as KubbFile.File<FileMeta>[]
        const rootFiles = filteredFiles
          .map((file) => {
            const tag = file.meta?.tag && camelCase(file.meta.tag, { delimiter: '', transform: camelCaseTransformMerge })
            const tagPath = getRelativePath(path.resolve(root, output), path.resolve(root, renderTemplate(template, { tag })))
            const tagName = camelCase(renderTemplate(groupBy.exportAs || '{{tag}}Schemas', { tag }), {
              delimiter: '',
              transform: camelCaseTransformMerge,
            })

            if (tagName) {
              return {
                baseName: 'index.ts' as const,
                path: path.resolve(root, output, 'index.ts'),
                source: '',
                exports: [{ path: `${tagPath}/index`, asAlias: true, name: tagName }],
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
