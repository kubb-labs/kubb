import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createPlugin, type Group, getPreset, mergeGenerators } from '@kubb/core'
import { version } from '../package.json'
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
export const pluginTs = createPlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
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

  const generators = preset.generators ?? []
  const mergedGenerator = mergeGenerators(generators)

  let resolveNameWarning = false
  let resolvePathWarning = false

  return {
    name: pluginTsName,
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
      }
    },
    resolvePath(baseName, pathMode, options) {
      if (!resolvePathWarning) {
        this.events.emit('warn', 'Do not use resolvePath for pluginTs, use resolverTs.resolvePath instead')
        resolvePathWarning = true
      }

      return this.plugin.resolver.resolvePath(
        { baseName, pathMode, tag: options?.group?.tag, path: options?.group?.path },
        { root: path.resolve(this.config.root, this.config.output.path), output, group: this.plugin.options.group },
      )
    },
    resolveName(name, type) {
      if (!resolveNameWarning) {
        this.events.emit('warn', 'Do not use resolveName for pluginTs, use resolverTs.default instead')
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
