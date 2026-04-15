import { camelCase } from '@internals/utils'
import { definePlugin, type Group, getPreset } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { zodGenerator } from './generators/zodGenerator.tsx'
import { zodGeneratorLegacy } from './generators/zodGeneratorLegacy.tsx'
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
export const pluginZod = definePlugin<PluginZod['options']>((options = {}) => {
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

  const generators = preset.generators ?? [compatibilityPreset === 'kubbV4' ? zodGeneratorLegacy : zodGenerator].filter(Boolean)

  const pluginOptions = {
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
  } as PluginZod['options']

  return {
    name: pluginZodName,
    options: pluginOptions,
    hooks: {
      'kubb:plugin:setup'({ addGenerator, setResolver, setRenderer, setTransformer }) {
        setRenderer(jsxRenderer)
        setResolver(preset.resolver)
        if (preset.transformer) {
          setTransformer(preset.transformer)
        }
        generators.forEach((generator) => {
          addGenerator(generator)
        })
      },
    },
  }
})
