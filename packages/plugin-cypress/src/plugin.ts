import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { cypressGenerator } from './generators/cypressGenerator.tsx'
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
export const pluginCypress = definePlugin<PluginCypress>((options) => {
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
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
  } = options

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
    name: pluginCypressName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverCypress, ...userResolver } : resolverCypress

        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          dataReturnType,
          group: groupConfig,
          baseURL,
          paramsCasing,
          paramsType,
          pathParamsType,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        ctx.addGenerator(cypressGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})
