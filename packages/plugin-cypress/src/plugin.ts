import { camelCase } from '@internals/utils'
import { definePlugin, type Group, getPreset } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { presets } from './presets.ts'
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
export const pluginCypress = definePlugin<PluginCypress['options']>((options) => {
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

  return {
    name: pluginCypressName,
    dependencies: [pluginTsName],
    options: {
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
    },
    hooks: {
      'kubb:plugin:setup'(ctx) {
        if (preset.resolver) {
          ctx.setResolver(preset.resolver)
        }
        if (preset.transformer) {
          ctx.setTransformer(preset.transformer)
        }
        for (const gen of preset.generators ?? []) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})
