import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { pluginClientName } from '@kubb/plugin-client'
import { OperationGenerator, pluginOasName, registerDefaultResolvers } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { MutationKey, QueryKey } from './components'
import { mutationGenerator, queryGenerator } from './generators'
import { defaultSvelteQueryResolvers } from './resolver.ts'
import type { PluginSvelteQuery } from './types.ts'

export const pluginSvelteQueryName = 'plugin-svelte-query' satisfies PluginSvelteQuery['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginSvelteQueryName, defaultSvelteQueryResolvers)

// Register name resolver with core
registerNameResolver(pluginSvelteQueryName, (name, type) => {
  if (type === 'type') {
    return pascalCase(name)
  }
  return camelCase(name, { isFile: type === 'file' })
})

// Register path resolver with core
registerPathResolver(pluginSvelteQueryName, (baseName, mode, options, ctx) => {
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
          return `${camelCase(groupCtx.group)}Controller`
        }

    return path.resolve(
      ctx.root,
      ctx.outputPath,
      groupName({
        group: ctx.group.type === 'path' ? options!.group!.path! : options!.group!.tag!,
      }),
      baseName,
    )
  }

  return path.resolve(ctx.root, ctx.outputPath, baseName)
})

export const pluginSvelteQuery = definePlugin<PluginSvelteQuery>((options) => {
  const {
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    transformers = {},
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutation = {},
    query = {},
    paramsCasing,
    mutationKey = MutationKey.getTransformer,
    queryKey = QueryKey.getTransformer,
    generators = [queryGenerator, mutationGenerator].filter(Boolean),
    contentType,
    client,
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  return {
    name: pluginSvelteQueryName,
    options: {
      output,
      client: {
        ...options.client,
        client: clientName,
        clientType: client?.clientType ?? 'function',
        dataReturnType: client?.dataReturnType ?? 'data',
        pathParamsType,
        importPath: clientImportPath,
      },
      queryKey,
      query:
        query === false
          ? false
          : {
              methods: ['get'],
              importPath: '@tanstack/svelte-query',
              ...query,
            },
      mutationKey,
      mutation:
        mutation === false
          ? false
          : {
              methods: ['post', 'put', 'patch', 'delete'],
              importPath: '@tanstack/svelte-query',
              ...mutation,
            },
      paramsType,
      pathParamsType,
      parser,
      paramsCasing,
      group,
      transformers,
    },
    pre: [pluginOasName, pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
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
        await this.upsertFile({
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
