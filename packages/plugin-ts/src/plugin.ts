import path from 'node:path'
import { walk } from '@kubb/ast'
import { createPlugin, getBarrelFiles, renderOperation, renderSchema } from '@kubb/core'
import { getPreset } from './presets.ts'
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
    exclude = [],
    include,
    override = [],
    enumType = 'asConst',
    enumKeyCasing = 'none',
    optionalType = 'questionToken',
    arrayType = 'array',
    syntaxType = 'type',
    paramsCasing,
    compatibilityPreset = 'default',
    resolvers: userResolvers = [],
    transformers: userTransformers = [],
    generators: userGenerators = [],
  } = options

  const { resolver, transformers, generators } = getPreset(compatibilityPreset, {
    resolvers: userResolvers,
    transformers: userTransformers,
    generators: userGenerators,
  })

  let resolveNameWarning = false
  let resolvePathWarning = false

  return {
    name: pluginTsName,
    options: {
      output,
      optionalType,
      group,
      arrayType,
      enumType,
      enumKeyCasing,
      syntaxType,
      paramsCasing,
      resolver,
      transformers,
    },
    resolvePath(baseName, pathMode, options) {
      if (!resolvePathWarning) {
        this.driver.events.emit('warn', 'Do not use resolvePath for pluginTs, use resolverTs.resolvePath instead')
        resolvePathWarning = true
      }

      return resolver.resolvePath(
        { baseName, pathMode, tag: options?.group?.tag, path: options?.group?.path },
        { root: path.resolve(this.config.root, this.config.output.path), output, group },
      )
    },
    resolveName(name, type) {
      if (!resolveNameWarning) {
        this.driver.events.emit('warn', 'Do not use resolveName for pluginTs, use resolverTs.default instead')
        resolveNameWarning = true
      }

      return resolver.default(name, type)
    },
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver, openInStudio } = this

      const root = path.resolve(config.root, config.output.path)

      if (!adapter) {
        throw new Error('Plugin cannot work without adapter being set')
      }

      await openInStudio({ ast: true })

      await walk(rootNode, {
        depth: 'shallow',
        async schema(schemaNode) {
          const writeTasks = generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const options = resolver.resolveOptions(schemaNode, { options: plugin.options, exclude, include, override })

              if (options === null) {
                return
              }

              await renderSchema(schemaNode, {
                options,
                adapter,
                config,
                fabric,
                Component: generator.Schema,
                plugin,
                driver,
              })
            }
          })

          await Promise.all(writeTasks)
        },
        async operation(operationNode) {
          const writeTasks = generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const options = resolver.resolveOptions(operationNode, { options: plugin.options, exclude, include, override })

              if (options === null) {
                return
              }

              await renderOperation(operationNode, {
                options,
                adapter,
                config,
                fabric,
                Component: generator.Operation,
                plugin,
                driver,
              })
            }
          })

          await Promise.all(writeTasks)
        },
      })

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
