import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import { createPlugin, type Group, getBarrelFiles, getPreset, renderOperation, renderOperations, renderSchema } from '@kubb/core'
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

      const collectedOperations: Array<OperationNode> = []

      await walk(rootNode, {
        depth: 'shallow',
        async schema(schemaNode) {
          const writeTasks = preset.generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const resolvedOptions = resolver.resolveOptions(schemaNode, {
                options: plugin.options,
                exclude,
                include,
                override,
              })

              if (resolvedOptions === null) {
                return
              }

              await renderSchema(schemaNode, {
                options: resolvedOptions,
                resolver,
                adapter,
                config,
                fabric,
                Component: generator.Schema,
                plugin,
                driver,
              })
            }

            if (generator.type === 'core' && generator.version === '2') {
              const resolvedOptions = resolver.resolveOptions(schemaNode, {
                options: plugin.options,
                exclude,
                include,
                override,
              })

              if (resolvedOptions === null) {
                return
              }

              const files = (await generator.schema?.({ node: schemaNode, options: resolvedOptions, resolver, adapter, config, plugin, driver })) ?? []
              await fabric.upsertFile(...files)
            }
          })

          await Promise.all(writeTasks)
        },
        async operation(operationNode) {
          const baseOptions = resolver.resolveOptions(operationNode, { options: plugin.options, exclude, include, override })

          if (baseOptions !== null) {
            collectedOperations.push(operationNode)
          }

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

            if (generator.type === 'core' && generator.version === '2') {
              const resolvedOptions = resolver.resolveOptions(operationNode, {
                options: plugin.options,
                exclude,
                include,
                override,
              })

              if (resolvedOptions === null) {
                return
              }

              const files =
                (await generator.operation?.({ node: operationNode, options: resolvedOptions, resolver, adapter, config, plugin, driver })) ?? []
              await fabric.upsertFile(...files)
            }
          })

          await Promise.all(writeTasks)
        },
      })

      const batchTasks = preset.generators.map(async (generator) => {
        if (generator.type === 'react' && generator.version === '2') {
          await renderOperations(collectedOperations, {
            options: plugin.options,
            resolver,
            adapter,
            config,
            fabric,
            Component: generator.Operations,
            plugin,
            driver,
          })
        }

        if (generator.type === 'core' && generator.version === '2') {
          const files =
            (await generator.operations?.({
              nodes: collectedOperations,
              options: plugin.options,
              resolver,
              adapter,
              config,
              plugin,
              driver,
            })) ?? []
          await this.upsertFile(...files)
        }
      })

      await Promise.all(batchTasks)

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
