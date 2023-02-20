/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */

import pathParser from 'path'

import { getRelativePath, createPlugin, getPathMode, validatePlugins } from '@kubb/core'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import type { Api as SwaggerApi } from '@kubb/swagger'

import { writeIndexes } from './utils/write'
import { TypeBuilder } from './builders'
import { OperationGenerator } from './generators/OperationGenerator'

import type { OpenAPIV3 } from 'openapi-types'
import type { Api, PluginOptions } from './types'

export const pluginName = 'swagger-typescript' as const

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

      if (mode === 'directory') {
        const mapFolderSchema = async ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          const path = await this.resolveId({ fileName: `${name}.ts`, directory, pluginName })

          if (!path) {
            return null
          }
          // generate and pass through new code back to the core so it can be write to that file
          const typescriptCode = await new TypeBuilder(oas)
            .add({
              schema,
              name,
            })
            .addImports(async (name) => {
              const resolvedTypeId = await this.resolveId({
                fileName: `${name}.ts`,
                directory,
                pluginName,
              })

              return getRelativePath(path, resolvedTypeId)
            })
            .addJSDocs()
            .print()

          return this.addFile({
            path,
            fileName: `${name}.ts`,
            source: typescriptCode,
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        const mapFileSchema = async ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
          // generate and pass through new code back to the core so it can be write to that file
          const builder = new TypeBuilder(oas)
          return builder
            .add({
              schema,
              name,
            })
            .addJSDocs()
            .print()
        }

        const promises = Object.entries(schemas).map(mapFileSchema)
        const source = await Promise.all(promises)
        const path = await this.resolveId({ fileName: '', directory, pluginName })
        if (!path) {
          return
        }

        await this.addFile({
          path,
          fileName: output,
          source: source.join('\n'),
        })
      }

      const operationGenerator = new OperationGenerator({
        oas,
        mode,
        directory,
        fileManager: this.fileManager,
        resolveId: api.resolveId,
      })

      await operationGenerator.build()
    },
    async buildEnd() {
      await writeIndexes(this.config.root, this.config.output.path, { extensions: /\.ts/, exclude: [/schemas/, /json/] })
    },
  }
})
