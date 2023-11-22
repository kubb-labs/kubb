import path from 'node:path'

import { createPlugin } from '@kubb/core'

import { getSchemas } from './utils/getSchemas.ts'
import { OasManager } from './OasManager.ts'

import type { KubbConfig } from '@kubb/core'
import type { Logger } from '@kubb/core/utils'
import type { Oas, OasTypes, PluginOptions } from './types.ts'

export const pluginName = 'swagger' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['schema', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'schemas', validate = true, serverIndex = 0, contentType } = options

  const getOas = async (config: KubbConfig, logger: Logger): Promise<Oas> => {
    try {
      // needs to be in a different variable or the catch here will not work(return of a promise instead)
      const oas = await OasManager.parseFromConfig(config, { validate })

      return oas
    } catch (e) {
      const error = e as Error

      logger.warn(error?.message)
      return OasManager.parseFromConfig(config, { validate: false })
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

      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, output, baseName)
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.json') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      if (output === false) {
        return undefined
      }

      const oas = await getOas(this.config, this.logger)
      await oas.dereference()
      const schemas = getSchemas({ oas, contentType })

      const mapSchema = async ([name, schema]: [string, OasTypes.SchemaObject]) => {
        const resolvedPath = this.resolvePath({
          baseName: `${name}.json`,
          pluginKey: this.plugin.key,
        })

        if (!resolvedPath) {
          return
        }

        await this.addFile({
          path: resolvedPath,
          baseName: `${name}.json`,
          source: JSON.stringify(schema),
          meta: {
            pluginKey: this.plugin.key,
          },
        })
      }

      const promises = Object.entries(schemas).map(mapSchema)
      await Promise.all(promises)
    },
  }
})
