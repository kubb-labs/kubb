import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import { createPlugin, type Group, getBarrelFiles, getPreset, runGeneratorOperation, runGeneratorOperations, runGeneratorSchema } from '@kubb/core'
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
export const pluginZod = createPlugin<PluginZod>((options) => {
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

  let resolveNameWarning = false
  let resolvePathWarning = false

  return {
    name: pluginZodName,
    get resolver() {
      return preset.resolver
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
        transformer: preset.transformer,
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
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver, openInStudio, resolver } = this

      const root = path.resolve(config.root, config.output.path)

      if (!adapter) {
        throw new Error(`[${pluginZodName}] No adapter found. Add an OAS adapter (e.g. pluginOas()) before this plugin in your Kubb config.`)
      }

      await openInStudio({ ast: true })

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
