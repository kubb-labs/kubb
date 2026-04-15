import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createSource, createText } from '@kubb/ast'
import { definePlugin, type Group } from '@kubb/core'
import { pluginClientName } from '@kubb/plugin-client'
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source'
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source'
import { source as configSource } from '@kubb/plugin-client/templates/config.source'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { MutationKey, QueryKey } from './components'
import {
  customHookOptionsFileGenerator,
  hookOptionsGenerator,
  infiniteQueryGenerator,
  mutationGenerator,
  queryGenerator,
  suspenseInfiniteQueryGenerator,
  suspenseQueryGenerator,
} from './generators'
import { resolverReactQuery } from './resolvers/resolverReactQuery.ts'
import { resolverReactQueryLegacy } from './resolvers/resolverReactQueryLegacy.ts'
import type { PluginReactQuery } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-react-query`, used to identify the plugin
 * in driver lookups and warnings.
 */
export const pluginReactQueryName = 'plugin-react-query' satisfies PluginReactQuery['name']

/**
 * The `@kubb/plugin-react-query` plugin factory.
 *
 * Generates React Query hooks from an OpenAPI/AST `RootNode`.
 * Walks operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginReactQuery } from '@kubb/plugin-react-query'
 *
 * export default defineConfig({
 *   plugins: [pluginReactQuery({ output: { path: 'hooks' } })],
 * })
 * ```
 */
export const pluginReactQuery = definePlugin<PluginReactQuery>((options) => {
  const {
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    suspense = {},
    infinite = false,
    transformers = {},
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutation,
    query,
    mutationKey = MutationKey.getTransformer,
    queryKey = QueryKey.getTransformer,
    customOptions,
    paramsCasing,
    contentType,
    client,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
    compatibilityPreset = 'default',
  } = options

  const defaultResolver = compatibilityPreset === 'kubbV4' ? resolverReactQueryLegacy : resolverReactQuery

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  const selectedGenerators =
    options.generators ??
    [queryGenerator, suspenseQueryGenerator, infiniteQueryGenerator, suspenseInfiniteQueryGenerator, mutationGenerator, hookOptionsGenerator, customHookOptionsFileGenerator].filter(
      Boolean,
    )

  const groupConfig = group
    ? ({
        ...group,
        name: group.name
          ? group.name
          : (ctx: { group: string }) => {
              if (group.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }
              return `${camelCase(ctx.group)}Controller`
            },
      } satisfies Group)
    : undefined

  return {
    name: pluginReactQueryName,
    options,
    dependencies: [pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...defaultResolver, ...userResolver } : defaultResolver

        ctx.setOptions({
          output,
          transformers,
          client: {
            bundle: client?.bundle,
            baseURL: client?.baseURL,
            client: clientName,
            clientType: client?.clientType ?? 'function',
            dataReturnType: client?.dataReturnType ?? 'data',
            pathParamsType,
            importPath: clientImportPath,
            paramsCasing,
          },
          infinite: infinite
            ? {
                queryParam: 'id',
                initialPageParam: 0,
                cursorParam: undefined,
                nextParam: undefined,
                previousParam: undefined,
                ...infinite,
              }
            : false,
          suspense,
          queryKey,
          query:
            query === false
              ? false
              : {
                  methods: ['get'],
                  importPath: '@tanstack/react-query',
                  ...query,
                },
          mutationKey,
          mutation:
            mutation === false
              ? false
              : {
                  methods: ['post', 'put', 'patch', 'delete'],
                  importPath: '@tanstack/react-query',
                  ...mutation,
                },
          customOptions: customOptions ? { name: 'useCustomHookOptions', ...customOptions } : undefined,
          paramsType,
          pathParamsType,
          parser,
          paramsCasing,
          group: groupConfig,
          exclude,
          include,
          override,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        for (const gen of selectedGenerators) {
          ctx.addGenerator(gen)
        }
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)

        const hasClientPlugin = !!ctx.config.plugins?.some((p) => (p as { name?: string }).name === pluginClientName)

        if (client?.bundle && !hasClientPlugin && !clientImportPath) {
          ctx.injectFile({
            baseName: 'fetch.ts',
            path: path.resolve(root, '.kubb/fetch.ts'),
            sources: [
              createSource({
                name: 'fetch',
                nodes: [createText(clientName === 'fetch' ? fetchClientSource : axiosClientSource)],
                isExportable: true,
                isIndexable: true,
              }),
            ],
          })
        }

        if (!hasClientPlugin) {
          ctx.injectFile({
            baseName: 'config.ts',
            path: path.resolve(root, '.kubb/config.ts'),
            sources: [
              createSource({
                name: 'config',
                nodes: [createText(configSource)],
                isExportable: false,
                isIndexable: false,
              }),
            ],
          })
        }
      },
    },
  }
})
