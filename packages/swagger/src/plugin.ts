import path from 'node:path'

import { createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'

import { getSchemas } from './utils/getSchemas.ts'
import { OasManager } from './OasManager.ts'

import type { Config } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import type { Oas, OasTypes } from './oas/index.ts'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = { path: 'schemas' }, validate = true, serverIndex = 0, contentType } = options

  const getOas = async (config: Config, logger: Logger): Promise<Oas> => {
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

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      return camelCase(name, { isFile: type === 'file' })
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.json') || !source) {
        return
      }

      return this.fileManager.write(source, writePath, { sanity: false })
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

        const resvoledFileName = this.resolveName({
          name: `${name}.json`,
          pluginKey,
          type: 'file',
        }) as `${string}.json`

        if (!resolvedPath) {
          return
        }

        await this.addFile({
          path: resolvedPath,
          baseName: resvoledFileName,
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
