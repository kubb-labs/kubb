import path from 'node:path'

import { createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'

import { getSchemas } from './utils/getSchemas.ts'
import { parseFromConfig } from './utils/parseFromConfig.ts'

import type { Config } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import type { Oas, OasTypes } from '@kubb/oas'
import type { FormatOptions } from '@kubb/oas/parser'
import type { PluginOas } from './types.ts'

export const pluginOasName = 'plugin-oas' satisfies PluginOas['name']

export const pluginOas = createPlugin<PluginOas>((options) => {
  const {
    output = { path: 'schemas', export: false },
    experimentalFilter: filter,
    experimentalSort: sort,
    validate = true,
    serverIndex = 0,
    contentType,
    oasClass,
  } = options

  const getOas = async ({ config, logger, formatOptions }: { config: Config; logger: Logger; formatOptions?: FormatOptions }): Promise<Oas> => {
    try {
      // needs to be in a different variable or the catch here will not work(return of a promise instead)
      const oas = await parseFromConfig(config, formatOptions, oasClass)

      if (validate) {
        await oas.valdiate()
      }

      return oas
    } catch (e) {
      const error = e as Error

      logger.emit('warning', error?.message)
      return parseFromConfig(config, {}, oasClass)
    }
  }

  return {
    name: pluginOasName,
    options,
    context() {
      const { config, logger } = this

      return {
        getOas(formatOptions) {
          return getOas({ config, logger, formatOptions })
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
    async buildStart() {
      if (!output) {
        return
      }

      const oas = await getOas({
        config: this.config,
        logger: this.logger,
        formatOptions: {
          filterSet: filter,
          sortSet: sort,
        },
      })
      await oas.dereference()

      const root = path.resolve(this.config.root, this.config.output.path)
      const schemas = getSchemas({ oas, contentType })

      const mapSchema = async ([name, schema]: [string, OasTypes.SchemaObject]) => {
        const baseName = `${camelCase(name)}.json` as `${string}.json`
        const resolvedPath = path.resolve(root, output.path, baseName)

        await this.addFile({
          path: resolvedPath,
          baseName,
          source: JSON.stringify(schema),
          meta: {
            pluginKey: this.plugin.key,
          },
          sources: [
            {
              name: camelCase(name),
              isExportable: false,
              value: JSON.stringify(schema),
            },
          ],
        })
      }

      const promises = Object.entries(schemas).map(mapSchema)
      await Promise.all(promises)
    },
  }
})
