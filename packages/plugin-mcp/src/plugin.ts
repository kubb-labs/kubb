import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import { createPlugin, type Group, getBarrelFiles, getPreset, runGeneratorOperation, runGeneratorOperations, runGeneratorSchema } from '@kubb/core'
import { type PluginClient, pluginClientName } from '@kubb/plugin-client'
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source'
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source'
import { source as configSource } from '@kubb/plugin-client/templates/config.source'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
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

  return {
    name: pluginMcpName,
    get resolver() {
      return preset.resolver
    },
    get transformer() {
      return preset.transformer
    },
    get options() {
      return {
        output,
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
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver } = this
      const root = path.resolve(config.root, config.output.path)
      const resolver = preset.resolver

      if (!adapter) {
        throw new Error('Plugin cannot work without adapter being set')
      }

      const baseURL = adapter.rootNode?.meta?.baseURL
      if (baseURL) {
        this.plugin.options.client.baseURL = this.plugin.options.client.baseURL || baseURL
      }

      const hasClientPlugin = !!driver.getPlugin<PluginClient>(pluginClientName)

      if (this.plugin.options.client.bundle && !hasClientPlugin && !this.plugin.options.client.importPath) {
        await this.addFile({
          baseName: 'fetch.ts',
          path: path.resolve(root, '.kubb/fetch.ts'),
          sources: [
            {
              name: 'fetch',
              value: this.plugin.options.client.client === 'fetch' ? fetchClientSource : axiosClientSource,
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
              value: configSource,
              isExportable: false,
              isIndexable: false,
            },
          ],
          imports: [],
          exports: [],
        })
      }

      const collectedOperations: Array<OperationNode> = []
      const generatorContext = { generators: preset.generators, plugin, resolver, exclude, include, override, fabric, adapter, config, driver }

      await walk(rootNode, {
        depth: 'shallow',
        async schema(schemaNode) {
          await runGeneratorSchema(schemaNode, generatorContext)
        },
        async operation(operationNode) {
          const baseOptions = resolver.resolveOptions(operationNode, { options: plugin.options, exclude, include, override })

          if (baseOptions !== null) {
            collectedOperations.push(operationNode)
          }

          await runGeneratorOperation(operationNode, generatorContext)
        },
      })

      await runGeneratorOperations(collectedOperations, generatorContext)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginName: this.plugin.name,
        },
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
