import pathParser from 'node:path'

import { createPlugin } from '@kubb/core'

import { oasParser } from './parsers/oasParser.ts'
import { getSchemas } from './utils/getSchemas.ts'

import type { KubbConfig, Logger } from '@kubb/core'
import type { OpenAPIV3 } from 'openapi-types'
import type { Oas, PluginOptions } from './types.ts'

export const pluginName: PluginOptions['name'] = 'swagger' as const

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'schemas', validate = true, serverIndex = 0, contentType } = options

  const getOas = async (config: KubbConfig, logger: Logger): Promise<Oas> => {
    try {
      // needs to be in a different variable or the catch here will not work(return of a promise instead)
      const oas = await oasParser(config, { validate })

      return oas
    } catch (e) {
      const error = e as Error

      logger.warn(error?.message)
      return oasParser(config, { validate: false })
    }
  }

  return {
    name: pluginName,
    options,
    kind: 'schema',
    api() {
      const { config, logger } = this

      return {
        getOas() {
          return getOas(config, logger)
        },
        async getSchemas({ includes } = {}) {
          const oas = await this.getOas()
          return getSchemas({ oas, contentType, includes })
        },
        async getBaseURL() {
          const oasInstance = await this.getOas()
          const baseURL = oasInstance.api.servers?.at(serverIndex)?.url
          return baseURL
        },
        contentType,
      }
    },
    resolvePath(baseName) {
      if (output === false) {
        return undefined
      }

      const root = pathParser.resolve(this.config.root, this.config.output.path)

      return pathParser.resolve(root, output, baseName)
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

      const oas = await getOas(this.config, this.logger)
      await oas.dereference()
      const schemas = getSchemas({ oas, contentType })

      const mapSchema = async ([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
        const path = this.resolvePath({
          baseName: `${name}.json`,
          pluginName,
        })

        if (!path) {
          return
        }

        await this.addFile({
          path,
          baseName: `${name}.json`,
          source: JSON.stringify(schema),
          meta: {
            pluginName,
          },
        })
      }

      const promises = Object.entries(schemas).map(mapSchema)
      await Promise.all(promises)
    },
  }
})
