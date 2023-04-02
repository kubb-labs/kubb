/* eslint-disable consistent-return */
import pathParser from 'path'

import { createPlugin } from '@kubb/core'

import { oasParser } from './parsers'

import type { Api, PluginOptions } from './types'
import type { OpenAPIV3 } from 'openapi-types'

export const pluginName = 'swagger' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'schemas', validate = true } = options
  const api: Api = {
    getOas: (config, oasOptions = { validate: false }) => oasParser(config, oasOptions),
  }

  return {
    name: pluginName,
    options,
    kind: 'schema',
    api,
    resolvePath(fileName, directory) {
      if (!directory) {
        return null
      }
      return pathParser.resolve(directory, fileName)
    },
    async writeFile(source, path) {
      if (!path.endsWith('.json') || !source) {
        return
      }

      await this.fileManager.write(source, path)
    },
    async buildStart() {
      if (output === false) {
        return undefined
      }

      const oas = await api.getOas(this.config, { validate })
      const schemas = oas.getDefinition().components?.schemas || {}

      const mapSchema = async ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
        const path = await this.resolvePath({
          fileName: `${name}.json`,
          directory: pathParser.resolve(this.config.root, this.config.output.path, output),
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
