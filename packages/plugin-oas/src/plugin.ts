import path from 'node:path'

import { createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'

import { getSchemas } from './utils/getSchemas.ts'

import type { Config } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import type { Oas, OasTypes } from '@kubb/oas'
import type { PluginOas } from './types.ts'
import { parseFromConfig } from './utils/parseFromConfig.ts'

export const pluginOasName = 'plugin-oas' satisfies PluginOas['name']

export const pluginOas = createPlugin<PluginOas>((options) => {
  const { output = { path: 'schemas', export: false }, validate = true, serverIndex = 0, contentType, oasClass } = options

  const getOas = async ({ config, logger }: { config: Config; logger: Logger }): Promise<Oas> => {
    try {
      // needs to be in a different variable or the catch here will not work(return of a promise instead)
      const oas = await parseFromConfig(config, oasClass)

      if (validate) {
        await oas.valdiate()
      }

      return oas
    } catch (e) {
      const error = e as Error

      logger.emit('warning', error?.message)
      return parseFromConfig(config, oasClass)
    }
  }

  return {
    name: pluginOasName,
    options,

    api() {
      const { config, logger } = this

      return {
        getOas() {
          return getOas({ config, logger })
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
    async writeFile(path, source) {
      if (!path.endsWith('.json') || !source) {
        return
      }

      return this.fileManager.write(path, source, { sanity: false })
    },
    async buildStart() {
      if (!output) {
        return
      }

      const oas = await getOas({
        config: this.config,
        logger: this.logger,
      })
      await oas.dereference()
      const schemas = getSchemas({ oas, contentType })

      const mapSchema = async ([name, schema]: [string, OasTypes.SchemaObject]) => {
        const resolvedPath = this.resolvePath({
          baseName: `${name}.json`,
          pluginKey: this.plugin.key,
        })

        const resvoledFileName = this.resolveName({
          name: `${name}.json`,
          pluginKey: [pluginOasName],
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
