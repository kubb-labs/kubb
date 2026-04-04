import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createFile, createSource } from '@kubb/ast'
import { createPlugin, type Group, getPreset, mergeGenerators } from '@kubb/core'
import { pluginClientName } from '@kubb/plugin-client'
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source'
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source'
import { source as configSource } from '@kubb/plugin-client/templates/config.source'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { version } from '../package.json'
import { presets } from './presets.ts'
import type { PluginMcp } from './types.ts'

export const pluginMcpName = 'plugin-mcp' satisfies PluginMcp['name']

export const pluginMcp = createPlugin<PluginMcp>((options) => {
  const {
    output = { path: 'mcp', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    paramsCasing,
    client,
    compatibilityPreset = 'default',
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  const preset = getPreset({
    preset: compatibilityPreset,
    presets,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators,
  })

  const generators = preset.generators ?? []
  const mergedGenerator = mergeGenerators(generators)

  return {
    name: pluginMcpName,
    version,
    get resolver() {
      return preset.resolver
    },
    get transformer() {
      return preset.transformer
    },
    get options() {
      return {
        output,
        exclude,
        include,
        override,
        group: group
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
          : undefined,
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
        resolver: preset.resolver,
      }
    },
    pre: [pluginTsName, pluginZodName].filter(Boolean),
    async schema(node, options) {
      return mergedGenerator.schema?.call(this, node, options)
    },
    async operation(node, options) {
      return mergedGenerator.operation?.call(this, node, options)
    },
    async operations(nodes, options) {
      return mergedGenerator.operations?.call(this, nodes, options)
    },
    async buildStart() {
      const { adapter, driver } = this
      const root = this.root

      const baseURL = adapter?.rootNode?.meta?.baseURL
      if (baseURL) {
        this.plugin.options.client.baseURL = this.plugin.options.client.baseURL || baseURL
      }

      const hasClientPlugin = !!driver.getPlugin(pluginClientName)

      if (this.plugin.options.client.bundle && !hasClientPlugin && !this.plugin.options.client.importPath) {
        await this.addFile(
          createFile({
            baseName: 'fetch.ts',
            path: path.resolve(root, '.kubb/fetch.ts'),
            sources: [
              createSource({
                name: 'fetch',
                value: this.plugin.options.client.client === 'fetch' ? fetchClientSource : axiosClientSource,
                isExportable: true,
                isIndexable: true,
              }),
            ],
            imports: [],
            exports: [],
          }),
        )
      }

      if (!hasClientPlugin) {
        await this.addFile(
          createFile({
            baseName: 'config.ts',
            path: path.resolve(root, '.kubb/config.ts'),
            sources: [
              createSource({
                name: 'config',
                value: configSource,
                isExportable: false,
                isIndexable: false,
              }),
            ],
            imports: [],
            exports: [],
          }),
        )
      }

      await this.openInStudio({ ast: true })
    },
  }
})
