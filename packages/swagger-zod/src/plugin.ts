/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */

import pathParser from 'path'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { getRelativePath, createPlugin, getPathMode, validatePlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi, OpenAPIV3 } from '@kubb/swagger'
import { writeIndexes } from '@kubb/ts-codegen'

import { ZodBuilder } from './builders'
import { OperationGenerator } from './generators/OperationGenerator'

import type { Api, PluginOptions } from './types'

export const pluginName = 'swagger-zod' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger-zod']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zod', groupBy } = options
  let swaggerApi: SwaggerApi

  const api: Api = {
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

      if (options?.tag && groupBy === 'tag') {
        return pathParser.resolve(directory, output, camelCase(`${options.tag}Controller`), fileName)
      }

      return pathParser.resolve(directory, output, fileName)
    },
  }

  return {
    name: pluginName,
    options,
    kind: 'schema',
    api,
    validate(plugins) {
      const valid = validatePlugins(plugins, [swaggerPluginName])
      if (valid) {
        swaggerApi = plugins.find((plugin) => plugin.name === swaggerPluginName)?.api
      }

      return valid
    },
    resolvePath(fileName, directory, options) {
      return api.resolvePath(fileName, directory, options)
    },
    resolveName(name) {
      return camelCase(`${name}Schema`, { delimiter: '', transform: camelCaseTransformMerge })
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
      const directory = pathParser.resolve(this.config.root, this.config.output.path)
      const mode = getPathMode(pathParser.resolve(directory, output))

      if (mode === 'directory') {
        const builder = await new ZodBuilder(oas).configure({
          resolveName: (params) => this.resolveName({ pluginName, ...params }),
          fileResolver: async (name) => {
            const resolvedTypeId = await this.resolvePath({
              fileName: `${name}.ts`,
              directory,
              pluginName,
            })

            const root = await this.resolvePath({ fileName: ``, directory, pluginName })

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
          const path = await this.resolvePath({ fileName: `${this.resolveName({ name, pluginName })}.ts`, directory, pluginName })

          if (!path) {
            return null
          }

          return this.addFile({
            path,
            fileName: `${this.resolveName({ name, pluginName })}.ts`,
            source: await builder.print(name),
            imports: [
              {
                name: 'z',
                path: 'zod',
              },
            ],
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        // outside the loop because we need to add files to just one instance to have the correct sorting, see refsSorter
        const builder = new ZodBuilder(oas).configure({
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
        const path = await this.resolvePath({ fileName: '', directory, pluginName })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          fileName: `${this.resolveName({ name: output, pluginName })}.ts`,
          source: await builder.print(),
          imports: [
            {
              name: 'z',
              path: 'zod',
            },
          ],
        })
      }

      const operationGenerator = new OperationGenerator({
        oas,
        mode,
        directory,
        fileManager: this.fileManager,
        resolveName: (params) => this.resolveName({ pluginName, ...params }),
        resolvePath: api.resolvePath,
      })

      await operationGenerator.build()
    },
    async buildEnd() {
      if (this.config.output.write || this.config.output.write === undefined) {
        await writeIndexes(this.config.root, this.config.output.path, { extensions: /\.ts/, exclude: [/schemas/, /json/] })
      }
    },
  }
})
