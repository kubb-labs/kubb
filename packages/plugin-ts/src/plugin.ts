import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { typeGenerator } from './generators/typeGenerator.tsx'
import { typeGeneratorLegacy } from './generators/typeGeneratorLegacy.tsx'
import { resolverTs } from './resolvers/resolverTs.ts'
import { resolverTsLegacy } from './resolvers/resolverTsLegacy.ts'
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
export const pluginTs = definePlugin<PluginTs>((options) => {
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
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
    compatibilityPreset = 'default',
  } = options

  const defaultResolver = compatibilityPreset === 'kubbV4' ? resolverTsLegacy : resolverTs
  const defaultGenerator = compatibilityPreset === 'kubbV4' ? typeGeneratorLegacy : typeGenerator

  const groupConfig = group
    ? ({
        ...group,
        name: (ctx) => {
          if (group.type === 'path') {
            return `${ctx.group.split('/')[1]}`
          }
          return `${camelCase(ctx.group)}Controller`
        },
      } satisfies Group)
    : undefined

  return {
    name: pluginTsName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          optionalType,
          group: groupConfig,
          arrayType,
          enumType,
          enumTypeSuffix,
          enumKeyCasing,
          syntaxType,
          paramsCasing,
          printer,
        })
        ctx.setResolver(userResolver ? { ...defaultResolver, ...userResolver } : defaultResolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        ctx.addGenerator(defaultGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})
