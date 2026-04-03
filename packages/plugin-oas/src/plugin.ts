import path from 'node:path'
import type { AsyncEventEmitter } from '@internals/utils'
import { camelCase } from '@internals/utils'
import { type Config, createPlugin, getMode, type KubbEvents, type UserGroup } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { parseFromConfig, resolveServerUrl } from '@kubb/oas'
import { version } from '../package.json'
import { jsonGenerator } from './generators'
import { OperationGenerator } from './OperationGenerator.ts'
import { SchemaGenerator } from './SchemaGenerator.ts'
import type { PluginOas } from './types.ts'

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
    serverVariables,
    contentType,
    oasClass,
    discriminator = 'strict',
    collisionDetection = false,
  } = options

  const getOas = async ({ validate, config, events }: { validate: boolean; config: Config; events: AsyncEventEmitter<KubbEvents> }): Promise<Oas> => {
    // needs to be in a different variable or the catch here will not work(return of a promise instead)
    const oas = await parseFromConfig(config, oasClass)

    oas.setOptions({
      contentType,
      discriminator,
      collisionDetection,
    })

    try {
      if (validate) {
        await oas.validate()
      }
    } catch (er) {
      const caughtError = er as Error
      const errorTimestamp = new Date()
      const error = new Error('OAS Validation failed', {
        cause: caughtError,
      })

      events.emit('info', caughtError.message)
      events.emit('debug', {
        date: errorTimestamp,
        logs: [`✗ ${error.message}`, caughtError.message],
      })
    }

    return oas
  }

  return {
    name: pluginOasName,
    version,
    options: {
      output,
      validate,
      discriminator,
      ...options,
      exclude: [],
      override: [],
    },
    inject() {
      const config = this.config
      const events = this.events

      let oas: Oas

      return {
        async getOas({ validate = false } = {}) {
          if (!oas) {
            oas = await getOas({ config, events, validate })
          }

          return oas
        },
        async getBaseURL() {
          const oas = await getOas({ config, events, validate: false })
          if (serverIndex === undefined) {
            return undefined
          }

          const server = oas.api.servers?.at(serverIndex)
          if (!server?.url) {
            return undefined
          }

          return resolveServerUrl(
            server as { url: string; variables?: Record<string, { default?: string | number; enum?: (string | number)[] }> },
            serverVariables,
          )
        },
      }
    },
    resolvePath(baseName, pathMode, options) {
      const root = this.root
      const mode = pathMode ?? getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: UserGroup['name'] = group?.name
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
      const oas = await this.getOas({ validate })

      if (!output || generators.length === 0) {
        return
      }

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
          fabric: this.fabric,
          oas,
          driver: this.driver,
          events: this.events,
          plugin: this.plugin,
          contentType,
          include: undefined,
          override: undefined,
          mode: 'split',
          output: output.path,
        },
      )

      const schemaFiles = await schemaGenerator.build(...generators)
      await this.upsertFile(...schemaFiles)

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        driver: this.driver,
        events: this.events,
        plugin: this.plugin,
        contentType,
        exclude: undefined,
        include: undefined,
        override: undefined,
        mode: 'split',
      })

      const operationFiles = await operationGenerator.build(...generators)

      await this.upsertFile(...operationFiles)
    },
  }
})
