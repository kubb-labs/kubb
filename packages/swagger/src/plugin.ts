import pathParser from 'path'

/* eslint-disable consistent-return */

import { createPlugin } from '@kubb/core'

import { oasParser } from './parsers'

import type { Api, PluginOptions } from './types'
import type { OpenAPIV3 } from 'openapi-types'

export const pluginName = 'swagger' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger']: PluginOptions['options']
  }
}

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
      if (output === false) {
        return undefined
      }

      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, output, fileName)
    },
    resolveName(name) {
      return name
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
