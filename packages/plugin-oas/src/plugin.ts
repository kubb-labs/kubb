import path from 'node:path'
import { type Config, createPlugin, type Group, getMode } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import { camelCase } from '@kubb/core/transformers'
import type { Oas } from '@kubb/oas'
import { jsonGenerator } from './generators'
import { OperationGenerator } from './OperationGenerator.ts'
import { SchemaGenerator } from './SchemaGenerator.ts'
import type { PluginOas } from './types.ts'
import { parseFromConfig } from './utils/parseFromConfig.ts'

export const pluginOasName = 'plugin-oas' satisfies PluginOas['name']

export const pluginOas = createPlugin<PluginOas>((options) => {
  const {
    output = {
      path: 'schemas',
    },
    group,
    validate = true,
    generators = [jsonGenerator],
    serverIndex,
    contentType,
    oasClass,
    discriminator = 'strict',
  } = options
  let oas: Oas

  const getOas = async ({ config, logger }: { config: Config; logger: Logger }): Promise<Oas> => {
    // needs to be in a different variable or the catch here will not work(return of a promise instead)
    oas = await parseFromConfig(config, oasClass)

    oas.setOptions({
      contentType,
      discriminator,
    })

    try {
      if (validate) {
        await oas.valdiate()
      }
    } catch (e) {
      const error = e as Error

      logger.emit('warning', error?.message)
    }

    return oas
  }

  return {
    name: pluginOasName,
    options: {
      output,
      validate,
      discriminator,
      ...options,
    },
    context() {
      const { config, logger } = this

      return {
        getOas() {
          return getOas({ config, logger })
        },
        async getBaseURL() {
          const oasInstance = await this.getOas()
          if (serverIndex) {
            return oasInstance.api.servers?.at(serverIndex)?.url
          }

          return undefined
        },
      }
    },
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: Group['name'] = group?.name
          ? group.name
          : (ctx) => {
              if (group?.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }
              return `${camelCase(ctx.group)}Controller`
            }

        return path.resolve(
          root,
          output.path,
          groupName({
            group: group.type === 'path' ? options.group.path! : options.group.tag!,
          }),
          baseName,
        )
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
          emptySchemaType: 'unknown',
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
