import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import { createPlugin, type Group, getBarrelFiles, getPreset, renderOperation } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { presets } from './presets.ts'
import { resolverCypress } from './resolvers/resolverCypress.ts'
import type { PluginCypress } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-cypress`, used to identify the plugin
 * in driver lookups and warnings.
 */
export const pluginCypressName = 'plugin-cypress' satisfies PluginCypress['name']

/**
 * The `@kubb/plugin-cypress` plugin factory.
 *
 * Generates Cypress `cy.request()` test functions from an OpenAPI/AST `RootNode`.
 * Walks operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginCypress } from '@kubb/plugin-cypress'
 *
 * export default defineConfig({
 *   plugins: [pluginCypress({ output: { path: 'cypress' } })],
 * })
 * ```
 */
export const pluginCypress = createPlugin<PluginCypress>((options) => {
  const {
    output = { path: 'cypress', barrelType: 'named' },
    group,
    dataReturnType = 'data',
    exclude = [],
    include,
    override = [],
    baseURL,
    paramsCasing,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    compatibilityPreset = 'default',
    resolvers: userResolvers = [],
    transformers: userTransformers = [],
    generators: userGenerators = [],
  } = options

  const preset = getPreset({
    preset: compatibilityPreset,
    presets,
    resolvers: [resolverCypress, ...userResolvers],
    transformers: userTransformers,
    generators: userGenerators,
  })

  return {
    name: pluginCypressName,
    get resolver() {
      return preset.resolver
    },
    get options() {
      return {
        output,
        dataReturnType,
        group: group
          ? ({
              ...options.group,
              name: options.group?.name
                ? options.group.name
                : (ctx: { group: string }) => {
                    if (group.type === 'path') {
                      return `${ctx.group.split('/')[1]}`
                    }
                    return `${camelCase(ctx.group)}Requests`
                  },
            } as Group)
          : undefined,
        baseURL,
        paramsCasing,
        paramsType,
        pathParamsType,
        resolver: preset.resolver,
        transformers: preset.transformers,
      }
    },
    pre: [pluginTsName].filter(Boolean),
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver } = this
      const root = path.resolve(config.root, config.output.path)
      const resolver = preset.resolver

      if (!adapter) {
        throw new Error('Plugin cannot work without adapter being set')
      }

      await walk(rootNode, {
        depth: 'shallow',
        async operation(operationNode) {
          const writeTasks = preset.generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const resolvedOptions = resolver.resolveOptions(operationNode, {
                options: plugin.options,
                exclude,
                include,
                override,
              })

              if (resolvedOptions === null) {
                return
              }

              await renderOperation(operationNode, {
                options: resolvedOptions,
                adapter,
                config,
                fabric,
                Component: generator.Operation,
                plugin,
                driver,
                resolver,
              })
            }
          })

          await Promise.all(writeTasks)
        },
      })

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
