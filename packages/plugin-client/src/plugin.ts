import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createPlugin, type Group, getPreset, mergeGenerators } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { version } from '../package.json'
import { classClientGenerator } from './generators/classClientGenerator.tsx'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import { operationsGenerator } from './generators/operationsGenerator.tsx'
import { staticClassClientGenerator } from './generators/staticClassClientGenerator.tsx'
import { presets } from './presets.ts'
import { source as axiosClientSource } from './templates/clients/axios.source.ts'
import { source as fetchClientSource } from './templates/clients/fetch.source.ts'
import { source as configSource } from './templates/config.source.ts'
import type { PluginClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-client`, used to identify the plugin
 * in driver lookups and warnings.
 */
export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

/**
 * The `@kubb/plugin-client` plugin factory.
 *
 * Generates type-safe HTTP client functions (or classes) from an OpenAPI/AST `RootNode`.
 * Walks operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginClient } from '@kubb/plugin-client'
 *
 * export default defineConfig({
 *   plugins: [pluginClient({ output: { path: 'clients' } })],
 * })
 * ```
 */
export const pluginClient = createPlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    urlType = false,
    dataReturnType = 'data',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    operations = false,
    paramsCasing,
    clientType = 'function',
    parser = 'client',
    client = 'axios',
    importPath,
    bundle = false,
    wrapper,
    baseURL,
    compatibilityPreset = 'default',
    resolver: userResolver,
    transformer: userTransformer,
  } = options

  const resolvedImportPath = importPath ?? (!bundle ? `@kubb/plugin-client/clients/${client}` : undefined)

  const selectedGenerators =
    options.generators ??
    [
      clientType === 'staticClass' ? staticClassClientGenerator : clientType === 'class' ? classClientGenerator : clientGenerator,
      group && clientType === 'function' ? groupedClientGenerator : undefined,
      operations ? operationsGenerator : undefined,
    ].filter((x): x is NonNullable<typeof x> => Boolean(x))

  const preset = getPreset({
    preset: compatibilityPreset,
    presets,
    resolver: userResolver,
    transformer: userTransformer,
    generators: selectedGenerators,
  })

  const generators = preset.generators ?? []
  const mergedGenerator = mergeGenerators(generators)

  let resolveNameWarning = false
  let resolvePathWarning = false

  return {
    name: pluginClientName,
    version,
    get resolver() {
      return preset.resolver
    },
    get transformer() {
      return preset.transformer
    },
    get options() {
      return {
        client,
        clientType,
        bundle,
        output,
        exclude,
        include,
        override,
        group: group
          ? ({
              ...group,
              name: group.name
                ? group.name
                : (ctx: { group: string }) => {
                    if (group.type === 'path') {
                      return `${ctx.group.split('/')[1]}`
                    }
                    return `${camelCase(ctx.group)}Controller`
                  },
            } satisfies Group)
          : undefined,
        parser,
        dataReturnType,
        importPath: resolvedImportPath,
        baseURL,
        paramsType,
        paramsCasing,
        pathParamsType,
        urlType,
        wrapper,
        resolver: preset.resolver,
      }
    },
    pre: [pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      if (!resolvePathWarning) {
        this.events.emit('warn', 'Do not use resolvePath for pluginClient, use resolverClient.resolvePath instead')
        resolvePathWarning = true
      }

      return this.plugin.resolver.resolvePath(
        { baseName, pathMode, tag: options?.group?.tag, path: options?.group?.path },
        { root: path.resolve(this.config.root, this.config.output.path), output, group: this.plugin.options.group },
      )
    },
    resolveName(name, type) {
      if (!resolveNameWarning) {
        this.events.emit('warn', 'Do not use resolveName for pluginClient, use resolverClient.default instead')
        resolveNameWarning = true
      }

      return this.plugin.resolver.default(name, type)
    },
    async operation(node, options) {
      return mergedGenerator.operation?.call(this, node, options)
    },
    async operations(nodes, options) {
      return mergedGenerator.operations?.call(this, nodes, options)
    },
    async buildStart() {
      const { config, plugin } = this
      const root = path.resolve(config.root, config.output.path)

      // pre add bundled fetch
      if (bundle && !plugin.options.importPath) {
        await this.addFile({
          baseName: 'fetch.ts',
          path: path.resolve(root, '.kubb/fetch.ts'),
          sources: [
            {
              name: 'fetch',
              value: plugin.options.client === 'fetch' ? fetchClientSource : axiosClientSource,
              isExportable: true,
              isIndexable: true,
            },
          ],
          imports: [],
          exports: [],
        })
      }

      await this.addFile({
        baseName: 'config.ts',
        path: path.resolve(root, '.kubb/config.ts'),
        sources: [
          {
            name: 'config',
            value: configSource,
            isExportable: false,
            isIndexable: false,
          },
        ],
        imports: [],
        exports: [],
      })
    },
  }
})
