import { camelCase } from '@internals/utils'
import { definePlugin, type Group, getPreset } from '@kubb/core'
import { presets } from './presets.ts'
import type { PluginZod } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-zod`, used to identify the plugin in driver lookups and warnings.
 */
export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

/**
 * The `@kubb/plugin-zod` plugin factory.
 *
 * Generates Zod validation schemas from an OpenAPI/AST `RootNode`.
 * Walks schemas and operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginZod } from '@kubb/plugin-zod'
 *
 * export default defineConfig({
 *   plugins: [pluginZod({ output: { path: 'zod' } })],
 * })
 * ```
 */
export const pluginZod = definePlugin<PluginZod['options']>((options) => {
  const {
    output = { path: 'zod', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    dateType = 'string',
    typed = false,
    operations = false,
    mini = false,
    guidType = 'uuid',
    importPath = mini ? 'zod/mini' : 'zod',
    coercion = false,
    inferred = false,
    wrapOutput = undefined,
    paramsCasing,
    printer,
    compatibilityPreset = 'default',
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
  } = options

  const preset = getPreset({
    preset: compatibilityPreset,
    presets: presets,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators,
  })

  return {
    name: pluginZodName,
    options: {
      output,
      exclude,
      include,
      override,
      group: group
        ? ({
            ...group,
            name: (ctx) => {
              if (group.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }
              return `${camelCase(ctx.group)}Controller`
            },
          } satisfies Group)
        : undefined,
      dateType,
      typed,
      importPath,
      coercion,
      operations,
      inferred,
      guidType,
      mini,
      wrapOutput,
      paramsCasing,
      printer,
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
