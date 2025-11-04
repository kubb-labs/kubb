import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mcpGenerator, serverGenerator } from './generators'
import type { PluginMcp } from './types.ts'

export const pluginMcpName = 'plugin-mcp' satisfies PluginMcp['name']

export const pluginMcp = definePlugin<PluginMcp>((options) => {
  const {
    output = { path: 'mcp', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    generators = [mcpGenerator, serverGenerator].filter(Boolean),
    contentType,
  } = options

  return {
    name: pluginMcpName,
    options: {
      output,
      group,
      client: {
        client: 'axios',
        dataReturnType: 'data',
        ...options.client,
      },
    },
    pre: [pluginOasName, pluginTsName, pluginZodName].filter(Boolean),
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
              return `${camelCase(ctx.group)}Requests`
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
    resolveName(name, type) {
      const resolvedName = camelCase(name, {
        isFile: type === 'file',
      })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()
      const baseURL = await this.getBaseURL()

      if (baseURL) {
        this.plugin.options.client.baseURL = baseURL
      }

      const containsFetcher = this.fabric.files.some((file) => file.baseName === 'fetcher.ts')

      if (!this.plugin.options.client.importPath && !containsFetcher) {
        // pre add bundled fetcher
        await this.addFile({
          baseName: 'fetcher.ts',
          path: path.resolve(root, '.kubb/fetcher.ts'),
          sources: [
            {
              name: 'fetcher',
              value: resolveModuleSource(
                this.plugin.options.client.client === 'fetch' ? '@kubb/plugin-client/templates/clients/fetch' : '@kubb/plugin-client/templates/clients/axios',
              ).source,
            },
          ],
        })
      }

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

      const files = await operationGenerator.build(...generators)
      await this.addFile(...files)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
        logger: this.logger,
      })

      await this.addFile(...barrelFiles)
    },
  }
})
