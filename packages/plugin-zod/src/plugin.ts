import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createPlugin, type Group, getPreset, mergeGenerators } from '@kubb/core'
import { presets } from './presets.ts'
import type { PluginZod } from './types.ts'
import { version } from '../package.json'

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
export const pluginZod = createPlugin<PluginZod>((options) => {
  const {
    output = { path: 'zod', barrelType: 'named' },
    group,
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

  const generators = preset.generators ?? []
  const mergedGenerator = mergeGenerators(generators)

  let resolveNameWarning = false
  let resolvePathWarning = false

  return {
    name: pluginZodName,
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
      }
    },
    resolvePath(baseName, pathMode, options) {
      if (!resolvePathWarning) {
        this.events.emit('warn', 'Do not use resolvePath for pluginZod, use resolverZod.resolvePath instead')
        resolvePathWarning = true
      }

      return this.plugin.resolver.resolvePath(
        { baseName, pathMode, tag: options?.group?.tag, path: options?.group?.path },
        { root: path.resolve(this.config.root, this.config.output.path), output, group: this.plugin.options.group },
      )
    },
    resolveName(name, type) {
      if (!resolveNameWarning) {
        this.events.emit('warn', 'Do not use resolveName for pluginZod, use resolverZod.default instead')
        resolveNameWarning = true
      }

      return this.plugin.resolver.default(name, type)
    },
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
