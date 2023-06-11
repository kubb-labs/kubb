import pathParser from 'node:path'

import { createPlugin, getPathMode, getRelativePath, renderTemplate, validatePlugins, writeIndexes } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { pluginName as swaggerTypeScriptPluginName } from '@kubb/swagger-ts'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { FakerBuilder } from './builders/index.ts'
import { OperationGenerator } from './generators/index.ts'

import type { OpenAPIV3, API as SwaggerApi } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-faker' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-faker']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'mocks', groupBy } = options
  let swaggerApi: SwaggerApi

  return {
    name: pluginName,
    options,
    kind: 'schema',
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName, swaggerTypeScriptPluginName])
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
        const name = camelCase(renderTemplate(groupBy.exportAs || '{{tag}}Mocks', { tag: options.tag }), {
          delimiter: '',
          transform: camelCaseTransformMerge,
        })

        if (name) {
          this.fileManager.addOrAppend({
            fileName: 'index.ts',
            path: pathParser.resolve(root, output, 'index.ts'),
            source: '',
            exports: [{ path, asAlias: true, name }],
          })
        }

        return pathParser.resolve(root, renderTemplate(template, { tag: options.tag }), fileName)
      }

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      return camelCase(`create ${name}`, { delimiter: '', transform: camelCaseTransformMerge })
    },
    async writeFile(source, path) {
      if (!path.endsWith('.ts') || !source) {
        return
      }

      await this.fileManager.write(source, path)
    },
    async buildStart() {
      const oas = await swaggerApi.getOas(this.config)
      const schemas = oas.getDefinition().components?.schemas || {}
      const root = pathParser.resolve(this.config.root, this.config.output.path)
      const mode = getPathMode(pathParser.resolve(root, output))

      if (mode === 'directory') {
        const builder = await new FakerBuilder(oas).configure({
          resolveName: (params) => this.resolveName({ pluginName, ...params }),
          fileResolver: (name, ref) => {
            const resolvedTypeId = this.resolvePath({
              fileName: `${name}.ts`,
              pluginName: ref.pluginName || pluginName,
            })

            const root = this.resolvePath({ fileName: ref.pluginName ? `${name}.ts` : ``, pluginName })

            return getRelativePath(root, resolvedTypeId)
          },
          withJSDocs: true,
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
            imports: [
              {
                name: ['faker'],
                path: '@faker-js/faker',
              },
            ],
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        // outside the loop because we need to add files to just one instance to have the correct sorting, see refsSorter
        const builder = new FakerBuilder(oas).configure({
          resolveName: (params) => this.resolveName({ pluginName, ...params }),
          withJSDocs: true,
        })
        const mapFileSchema = ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        }

        Object.entries(schemas).map(mapFileSchema)
        const path = this.resolvePath({ fileName: '', pluginName })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          fileName: `${this.resolveName({ name: output, pluginName })}.ts`,
          source: builder.print(),
          imports: [
            {
              name: ['faker'],
              path: '@faker-js/faker',
            },
          ],
        })
      }

      const operationGenerator = new OperationGenerator({
        oas,
        mode,
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
