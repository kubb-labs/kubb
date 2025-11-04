import path from 'node:path'
import { createPlugin, type Group, getBarrelFiles, getMode, type Plugin } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { pluginClientName } from '@kubb/plugin-client'
import type { PluginOas } from '@kubb/plugin-oas'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { MutationKey, QueryKey } from './components'
import { infiniteQueryGenerator, mutationGenerator, queryGenerator } from './generators'
import type { PluginVueQuery } from './types.ts'

export const pluginVueQueryName = 'plugin-vue-query' satisfies PluginVueQuery['name']

export const pluginVueQuery = createPlugin<PluginVueQuery>((options) => {
  const {
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    infinite,
    transformers = {},
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutation = {},
    query = {},
    paramsCasing,
    mutationKey = MutationKey.getTransformer,
    queryKey = QueryKey.getTransformer,
    generators = [queryGenerator, infiniteQueryGenerator, mutationGenerator].filter(Boolean),
    contentType,
  } = options

  return {
    name: pluginVueQueryName,
    options: {
      output,
      client: {
        client: 'axios',
        importPath: undefined,
        dataReturnType: 'data',
        pathParamsType,
        ...options.client,
      },
      infinite: infinite
        ? {
            queryParam: 'id',
            initialPageParam: 0,
            cursorParam: undefined,
            ...infinite,
          }
        : false,
      queryKey,
      query:
        query === false
          ? false
          : {
              methods: ['get'],
              importPath: '@tanstack/vue-query',
              ...query,
            },
      mutationKey,
      mutation: {
        methods: ['post', 'put', 'patch', 'delete'],
        importPath: '@tanstack/vue-query',
        ...mutation,
      },
      paramsType,
      pathParamsType,
      parser,
      paramsCasing,
      group,
    },
    pre: [pluginOasName, pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
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
    resolveName(name, type) {
      let resolvedName = camelCase(name)

      if (type === 'file' || type === 'function') {
        resolvedName = camelCase(name, {
          isFile: type === 'file',
        })
      }
      if (type === 'type') {
        resolvedName = pascalCase(name)
      }

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const [swaggerPlugin]: [Plugin<PluginOas>] = this.pluginManager.getDependedPlugins<PluginOas>([pluginOasName])

      const oas = await swaggerPlugin.context.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const baseURL = await swaggerPlugin.context.getBaseURL()

      if (baseURL) {
        this.plugin.options.client.baseURL = baseURL
      }

      const hasClientPlugin = !!this.pluginManager.getPluginByKey([pluginClientName])
      const containsFetcher = this.fabric.files.some((file) => file.baseName === 'fetcher.ts')

      if (!hasClientPlugin && !this.plugin.options.client.importPath && !containsFetcher) {
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
