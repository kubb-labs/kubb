/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */

import pathParser from 'path'

import { pascalCase } from 'change-case'

import { getRelativePath, createPlugin, getPathMode, validatePlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi, OpenAPIV3 } from '@kubb/swagger'
import { writeIndexes } from '@kubb/ts-codegen'

import { TypeBuilder } from './builders'
import { OperationGenerator } from './generators/OperationGenerator'

import type { Api, PluginOptions } from './types'

export const pluginName = 'swagger-ts' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'models' } = options
  let swaggerApi: SwaggerApi

  const api: Api = {
    resolveId(fileName, directory) {
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
    resolveId(fileName, directory) {
      return api.resolveId(fileName, directory)
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

      const nameResolver = (name: string) => pascalCase(name, { delimiter: '' })

      if (mode === 'directory') {
        const builder = await new TypeBuilder(oas).configure({
          nameResolver,
          fileResolver: async (name) => {
            const resolvedTypeId = await this.resolveId({
              fileName: `${name}.ts`,
              directory,
              pluginName,
            })

            const root = await this.resolveId({ fileName: ``, directory, pluginName })

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
          const path = await this.resolveId({ fileName: `${nameResolver(name)}.ts`, directory, pluginName })

          if (!path) {
            return null
          }

          return this.addFile({
            path,
            fileName: `${nameResolver(name)}.ts`,
            source: await builder.print(name),
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        // outside the loop because we need to add files to just one instance to have the correct sorting, see refsSorter
        const builder = new TypeBuilder(oas).configure({
          nameResolver,
          withJSDocs: true,
        })
        Object.entries(schemas).forEach(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          return builder.add({
            schema,
            name,
          })
        })

        const path = await this.resolveId({ fileName: '', directory, pluginName })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          fileName: `${nameResolver(output)}.ts`,
          source: await builder.print(),
        })
      }

      const operationGenerator = new OperationGenerator({
        oas,
        mode,
        directory,
        fileManager: this.fileManager,
        nameResolver,
        resolveId: api.resolveId,
      })

      await operationGenerator.build()
    },
    async buildEnd() {
      await writeIndexes(this.config.root, this.config.output.path, { extensions: /\.ts/, exclude: [/schemas/, /json/] })
    },
  }
})
