import { camelCase } from '@internals/utils'
import { definePlugin, type Group, getPreset } from '@kubb/core'
import { presets } from './presets.ts'
import type { PluginTs } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-ts`, used to identify the plugin in driver lookups and warnings.
 */
export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

/**
 * The `@kubb/plugin-ts` plugin factory.
 *
 * Generates TypeScript type declarations from an OpenAPI/AST `RootNode`.
 * Walks schemas and operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   plugins: [pluginTs({ output: { path: 'types' }, enumType: 'asConst' })],
 * })
 * ```
 */
export const pluginTs = definePlugin<PluginTs['options']>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    enumType = 'asConst',
    enumTypeSuffix = 'Key',
    enumKeyCasing = 'none',
    optionalType = 'questionToken',
    arrayType = 'array',
    syntaxType = 'type',
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
    name: pluginTsName,
    options: {
      output,
      exclude,
      include,
      override,
      optionalType,
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
      arrayType,
      enumType,
      enumTypeSuffix,
      enumKeyCasing,
      syntaxType,
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
