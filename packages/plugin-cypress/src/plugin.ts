import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import { createPlugin, type Group, getBarrelFiles, getPreset, runGeneratorOperation, runGeneratorOperations, runGeneratorSchema } from '@kubb/core'
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
