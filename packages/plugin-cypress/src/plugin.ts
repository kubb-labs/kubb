import { camelCase } from '@internals/utils'
import { createPlugin, type Group, getPreset, mergeGenerators } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { presets } from './presets.ts'
import type { PluginCypress } from './types.ts'
import { version } from '../package.json'

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
    exclude = [],
    include,
    override = [],
    dataReturnType = 'data',
    baseURL,
    paramsCasing,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    compatibilityPreset = 'default',
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
  } = options

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
    name: pluginCypressName,
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
      }
    },
    pre: [pluginTsName].filter(Boolean),
    async schema(node, options) {
      return mergedGenerator.schema?.call(this, node, options)
    },
    async operation(node, options) {
      return mergedGenerator.operation?.call(this, node, options)
    },
    async operations(nodes, options) {
      return mergedGenerator.operations?.call(this, nodes, options)
    },
    async install() {
      await this.openInStudio({ ast: true })
    },
  }
})
