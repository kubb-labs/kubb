import path from 'node:path'
import { type Config, createPlugin, type Group, getMode } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import type { Oas } from '@kubb/oas'
import { parseFromConfig } from '@kubb/oas'
import { Generator } from './Generator.ts'
import { jsonGenerator } from './generators'
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
    contentType,
    oasClass,
    discriminator = 'strict',
  } = options

  const getOas = async ({ config }: { config: Config }): Promise<Oas> => {
    // needs to be in a different variable or the catch here will not work(return of a promise instead)
    const oas = await parseFromConfig(config, oasClass)

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

      console.warn(error?.message)
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
    inject() {
      const config = this.config
      let oas: Oas

      return {
        async getOas() {
          if (!oas) {
            oas = await getOas({ config })
          }

          return oas
        },
        async getBaseURL() {
          const oas = await getOas({ config })
          if (serverIndex) {
            return oas.api.servers?.at(serverIndex)?.url
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
    async install() {
      if (!output) {
        return
      }

      const oas = await this.getOas()
      await oas.dereference()

      const generator = new Generator(
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
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType,
          // for plugin-oas, we always run split mode and include schema output
          exclude: undefined,
          include: undefined,
          override: undefined,
          mode: 'split',
          output: output.path,
        },
      )

      const files = await generator.build(...generators)
      await this.addFile(...files)
    },
  }
})
