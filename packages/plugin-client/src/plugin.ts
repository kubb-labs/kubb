import path from 'node:path'
import { camelCase } from '@internals/utils'

import { ast, definePlugin, type Group } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { classClientGenerator } from './generators/classClientGenerator.tsx'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import { operationsGenerator } from './generators/operationsGenerator.tsx'
import { staticClassClientGenerator } from './generators/staticClassClientGenerator.tsx'
import { resolverClient } from './resolvers/resolverClient.ts'
import { resolverClientLegacy } from './resolvers/resolverClientLegacy.ts'
import { source as axiosClientSource } from './templates/clients/axios.source.ts'
import { source as fetchClientSource } from './templates/clients/fetch.source.ts'
import { source as configSource } from './templates/config.source.ts'
import type { PluginClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-client`, used to identify the plugin
 * in driver lookups and warnings.
 */
export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

/**
 * The `@kubb/plugin-client` plugin factory.
 *
 * Generates type-safe HTTP client functions (or classes) from an OpenAPI/AST `RootNode`.
 * Walks operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginClient } from '@kubb/plugin-client'
 *
 * export default defineConfig({
 *   plugins: [pluginClient({ output: { path: 'clients' } })],
 * })
 * ```
 */
export const pluginClient = definePlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    urlType = false,
    dataReturnType = 'data',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    operations = false,
    paramsCasing,
    clientType = 'function',
    parser = 'client',
    client = 'axios',
    importPath,
    bundle = false,
    wrapper,
    baseURL,
    resolver: userResolver,
    transformer: userTransformer,
    compatibilityPreset = 'default',
  } = options

  const defaultResolver = compatibilityPreset === 'kubbV4' ? resolverClientLegacy : resolverClient

  const resolvedImportPath = importPath ?? (!bundle ? `@kubb/plugin-client/clients/${client}` : undefined)

  const selectedGenerators =
    options.generators ??
    [
      clientType === 'staticClass' ? staticClassClientGenerator : clientType === 'class' ? classClientGenerator : clientGenerator,
      group && clientType === 'function' ? groupedClientGenerator : undefined,
      operations ? operationsGenerator : undefined,
    ].filter((x): x is NonNullable<typeof x> => Boolean(x))

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
    name: pluginClientName,
    options,
    dependencies: [pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...defaultResolver, ...userResolver } : defaultResolver

        ctx.setOptions({
          client,
          clientType,
          bundle,
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          parser,
          dataReturnType,
          importPath: resolvedImportPath,
          baseURL,
          paramsType,
          paramsCasing,
          pathParamsType,
          urlType,
          wrapper,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        for (const gen of selectedGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)

        if (bundle && !resolvedImportPath) {
          ctx.injectFile({
            baseName: 'fetch.ts',
            path: path.resolve(root, '.kubb/fetch.ts'),
            sources: [
              ast.createSource({
                name: 'fetch',
                nodes: [ast.createText(client === 'fetch' ? fetchClientSource : axiosClientSource)],
                isExportable: true,
                isIndexable: true,
              }),
            ],
          })
        }

        ctx.injectFile({
          baseName: 'config.ts',
          path: path.resolve(root, '.kubb/config.ts'),
          sources: [
            ast.createSource({
              name: 'config',
              nodes: [ast.createText(configSource)],
              isExportable: false,
              isIndexable: false,
            }),
          ],
        })
      },
    },
  }
})
