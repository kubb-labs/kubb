import pathParser from 'node:path'

import { createPlugin } from '@kubb/core'

import { oasParser } from './parsers/oasParser.ts'

import type { OpenAPIV3 } from 'openapi-types'
import type { PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger' as const

// Register your plugin for maximum type safety
declare module '@kubb/core' {
  interface Register {
    ['@kubb/swagger']: PluginOptions['options']
  }
}

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'schemas', validate = true, serverIndex = 0 } = options

  return {
    name: pluginName,
    options,
    kind: 'schema',
    api() {
      const config = this.config

      return {
        get oas() {
          return oasParser(config, { validate })
        },
        async getBaseURL() {
          const oasInstance = await oasParser(config, { validate })
          const baseURL = oasInstance.api.servers?.at(serverIndex)?.url
          return baseURL
        },
        getOas: (config, oasOptions = { validate: false }) => oasParser(config, oasOptions),
      }
    },
    resolvePath(fileName) {
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

      const oas = await oasParser(this.config, { validate })
      const schemas = oas.getDefinition().components?.schemas || {}

      const mapSchema = async ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
        const path = this.resolvePath({
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
