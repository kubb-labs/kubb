import path from 'node:path'
import { walk } from '@kubb/ast'
import { createPlugin, getBarrelFiles, getPreset, renderOperation } from '@kubb/core'
import { pluginTsName, presetsTs } from '@kubb/plugin-ts'
import { presetsCypress } from './presets.ts'
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
export const pluginCypress = createPlugin<PluginCypress>((options) => {
  const {
    output = { path: 'cypress', barrelType: 'named' },
    group,
    dataReturnType = 'data',
    exclude = [],
    include,
    override = [],
    baseURL,
    paramsCasing,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    compatibilityPreset = 'default',
    resolvers: userResolvers = [],
    transformers: userTransformers = [],
    generators: userGenerators = [],
  } = options

  const { resolver: resolverTs } = getPreset({
    preset: compatibilityPreset,
    presets: presetsTs,
  })

  const { resolver, transformers, generators } = getPreset({
    preset: compatibilityPreset,
    presets: presetsCypress,
    resolvers: [resolverCypress, ...userResolvers],
    transformers: userTransformers,
    generators: userGenerators,
  })

  let resolveNameWarning = false
  let resolvePathWarning = false

  return {
    name: pluginCypressName,
    options: {
      output,
      dataReturnType,
      group,
      baseURL,
      paramsCasing,
      paramsType,
      pathParamsType,
      resolver,
      resolverTs,
      transformers,
    },
    pre: [pluginTsName].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      if (!resolvePathWarning) {
        this.driver.events.emit('warn', 'Do not use resolvePath for pluginCypress, use resolverCypress.resolvePath instead')
        resolvePathWarning = true
      }

      return resolver.resolvePath(
        { baseName, pathMode, tag: options?.group?.tag, path: options?.group?.path },
        { root: path.resolve(this.config.root, this.config.output.path), output, group },
      )
    },
    resolveName(name, type) {
      if (!resolveNameWarning) {
        this.driver.events.emit('warn', 'Do not use resolveName for pluginCypress, use resolverCypress.default instead')
        resolveNameWarning = true
      }

      return resolver.default(name, type)
    },
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver } = this

      const root = path.resolve(config.root, config.output.path)

      if (!adapter) {
        throw new Error('Plugin cannot work without adapter being set')
      }

      await walk(rootNode, {
        depth: 'shallow',
        async operation(operationNode) {
          const writeTasks = generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const resolvedOptions = resolver.resolveOptions(operationNode, {
                options: plugin.options,
                exclude,
                include,
                override,
              })

              if (resolvedOptions === null) {
                return
              }

              await renderOperation(operationNode, {
                options: resolvedOptions,
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
