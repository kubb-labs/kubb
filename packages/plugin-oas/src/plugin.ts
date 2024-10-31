import { FileManager, createPlugin } from '@kubb/core'

import { getSchemas } from './utils/getSchemas.ts'
import { parseFromConfig } from './utils/parseFromConfig.ts'

import path from 'node:path'
import type { Config } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import type { Oas } from '@kubb/oas'
import { OperationGenerator } from './OperationGenerator.ts'
import { SchemaGenerator } from './SchemaGenerator.ts'
import { jsonGenerator } from './generators'
import type { PluginOas } from './types.ts'

export const pluginOasName = 'plugin-oas' satisfies PluginOas['name']

export const pluginOas = createPlugin<PluginOas>((options) => {
  const {
    output = {
      path: 'schemas',
    },
    validate = true,
    generators = [jsonGenerator],
    serverIndex,
    contentType,
    oasClass,
  } = options

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
    options: {
      output,
      ...options,
    },
    context() {
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
          if (serverIndex) {
            return oasInstance.api.servers?.at(serverIndex)?.url
          }

          return undefined
        },
        contentType,
      }
    },
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      return path.resolve(root, output.path, baseName)
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

      const schemaGenerator = new SchemaGenerator(
        {
          unknownType: 'unknown',
          dateType: 'date',
          transformers: {},
          ...this.plugin.options,
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType,
          include: undefined,
          override: undefined,
          mode: 'split',
          output: output.path,
        },
      )

      const schemaFiles = await schemaGenerator.build(...generators)
      await this.addFile(...schemaFiles)

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType,
        exclude: undefined,
        include: undefined,
        override: undefined,
        mode: 'split',
      })

      const operationFiles = await operationGenerator.build(...generators)

      await this.addFile(...operationFiles)
    },
  }
})
