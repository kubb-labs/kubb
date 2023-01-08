import pathParser from 'path'

import { createPlugin } from '@kubb/core'

import { oasParser } from './parsers'

import type { Api, PluginOptions } from './types'
import type { OpenAPIV3 } from 'openapi-types'

export const pluginName = 'swagger' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'schemas', validate = true, version = '3' } = options
  const api: Api = {
    getOas: (config) => oasParser(config, { validate }),
    options,
  }

  return {
    name: pluginName,
    kind: 'schema',
    api,
    resolveId(fileName, directory) {
      if (!directory || output === false) {
        return null
      }
      return pathParser.resolve(directory, output, fileName)
    },
    async writeFile(source, path) {
      if (!path.endsWith('.json') || !source) {
        return
      }

      await this.fileManager.write(source, path)
    },
    async buildStart() {
      const oas = await api.getOas(this.config)
      const schemas = oas.getDefinition().components?.schemas || {}

      const mapSchema = async ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
        const path = await this.resolveId({
          fileName: `${name}.json`,
          directory: pathParser.resolve(this.config.root, this.config.output.path),
          pluginName,
        })

        if (!path) {
          return
        }

        await this.addFile({
          path,
          fileName: `${name}.json`,
          source: JSON.stringify(schema),
        })
      }

      const promises = Object.entries(schemas).map(mapSchema)
      await Promise.all(promises)
    },
  }
})
