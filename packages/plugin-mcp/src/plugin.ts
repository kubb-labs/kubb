import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { pluginClientName } from '@kubb/plugin-client'
import { OperationGenerator, pluginOasName, registerDefaultResolvers } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mcpGenerator, serverGenerator } from './generators'
import { defaultMcpResolvers } from './resolver.ts'
import type { PluginMcp } from './types.ts'

export const pluginMcpName = 'plugin-mcp' satisfies PluginMcp['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginMcpName, defaultMcpResolvers)

// Register name resolver with core
registerNameResolver(pluginMcpName, (name, type) => {
  return camelCase(name, { isFile: type === 'file' })
})

// Register path resolver with core
registerPathResolver(pluginMcpName, (baseName, mode, options, ctx) => {
  if (mode === 'single') {
    return path.resolve(ctx.root, ctx.outputPath)
  }

  if (ctx.group && (options?.group?.path || options?.group?.tag)) {
    const groupName: Group['name'] = ctx.group?.name
      ? ctx.group.name
      : (groupCtx) => {
          if (ctx.group?.type === 'path') {
            return `${groupCtx.group.split('/')[1]}`
          }
          return `${camelCase(groupCtx.group)}Requests`
        }

    return path.resolve(
      ctx.root,
      ctx.outputPath,
      groupName({
        group: ctx.group.type === 'path' ? options!.group!.path! : options!.group!.tag!,
      }),
      baseName
    )
  }

  return path.resolve(ctx.root, ctx.outputPath, baseName)
})

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
    client,
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  return {
    name: pluginMcpName,
    options: {
      output,
      group,
      client: {
        client: clientName,
        clientType: client?.clientType ?? 'function',
        importPath: clientImportPath,
        dataReturnType: 'data',
        ...options.client,
      },
      transformers,
    },
    pre: [pluginOasName, pluginTsName, pluginZodName].filter(Boolean),
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()
      const baseURL = await this.getBaseURL()

      if (baseURL) {
        this.plugin.options.client.baseURL = baseURL
      }

      const hasClientPlugin = !!this.pluginManager.getPluginByKey([pluginClientName])

      if (this.plugin.options.client.bundle && !hasClientPlugin && !this.plugin.options.client.importPath) {
        // pre add bundled fetch
        await this.addFile({
          baseName: 'fetch.ts',
          path: path.resolve(root, '.kubb/fetch.ts'),
          sources: [
            {
              name: 'fetch',
              value: resolveModuleSource(
                this.plugin.options.client.client === 'fetch' ? '@kubb/plugin-client/templates/clients/fetch' : '@kubb/plugin-client/templates/clients/axios',
              ).source,
              isExportable: true,
              isIndexable: true,
            },
          ],
          imports: [],
          exports: [],
        })
      }

      if (!hasClientPlugin) {
        await this.addFile({
          baseName: 'config.ts',
          path: path.resolve(root, '.kubb/config.ts'),
          sources: [
            {
              name: 'config',
              value: resolveModuleSource('@kubb/plugin-client/templates/config').source,
              isExportable: false,
              isIndexable: false,
            },
          ],
          imports: [],
          exports: [],
        })
      }

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        events: this.events,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

      const files = await operationGenerator.build(...generators)
      await this.upsertFile(...files)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
