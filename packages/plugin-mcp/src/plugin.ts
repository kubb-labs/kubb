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
import { mcpGenerator } from './generators/mcpGenerator.tsx'
import { serverGenerator } from './generators/serverGenerator.tsx'
import { serverGeneratorLegacy } from './generators/serverGeneratorLegacy.tsx'
import { resolverMcp } from './resolvers/resolverMcp.ts'
import type { PluginMcp } from './types.ts'

export const pluginMcpName = 'plugin-mcp' satisfies PluginMcp['name']

export const pluginMcp = definePlugin<PluginMcp>((options) => {
  const {
    output = { path: 'mcp', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    paramsCasing,
    client,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
    compatibilityPreset = 'default',
  } = options

  const defaultServerGenerator = compatibilityPreset === 'kubbV4' ? serverGeneratorLegacy : serverGenerator

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  const groupConfig = group
    ? ({
        ...group,
        name: group.name
          ? group.name
          : (ctx: { group: string }) => {
              if (group.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }
              return `${camelCase(ctx.group)}Requests`
            },
      } satisfies Group)
    : undefined

  return {
    name: pluginMcpName,
    options,
    dependencies: [pluginTsName, pluginZodName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          paramsCasing,
          client: {
            client: clientName,
            clientType: client?.clientType ?? 'function',
            importPath: clientImportPath,
            dataReturnType: client?.dataReturnType ?? 'data',
            bundle: client?.bundle,
            baseURL: client?.baseURL,
            paramsCasing: client?.paramsCasing,
          },
        })
        ctx.setResolver(userResolver ? { ...resolverMcp, ...userResolver } : resolverMcp)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        ctx.addGenerator(mcpGenerator)
        ctx.addGenerator(defaultServerGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const hasClientPlugin = ctx.config.plugins?.some((p) => p.name === pluginClientName)

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
