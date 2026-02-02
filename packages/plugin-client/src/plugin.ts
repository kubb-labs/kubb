import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName, registerDefaultResolvers } from '@kubb/plugin-oas'
import { pluginZodName } from '@kubb/plugin-zod'
import { classClientGenerator, operationsGenerator } from './generators'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import { staticClassClientGenerator } from './generators/staticClassClientGenerator.tsx'
import { defaultClientResolvers } from './resolver.ts'
import type { PluginClient } from './types.ts'

export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginClientName, defaultClientResolvers)

// Register name resolver with core
registerNameResolver(pluginClientName, (name, type) => {
  return camelCase(name, { isFile: type === 'file' })
})

// Register path resolver with core
registerPathResolver(pluginClientName, (baseName, mode, options, ctx) => {
  if (mode === 'single') {
    return path.resolve(ctx.root, ctx.outputPath)
  }

  if (ctx.group && (options?.group?.path || options?.group?.tag)) {
    const groupName: Group['name'] = ctx.group?.name
      ? ctx.group.name
      : (groupCtx) => {
          if (ctx.group?.type === 'path') {
            return `${groupCtx.group.split('/')[1]}`
          }
          return `${camelCase(groupCtx.group)}Controller`
        }

    return path.resolve(
      ctx.root,
      ctx.outputPath,
      groupName({
        group: ctx.group.type === 'path' ? options!.group!.path! : options!.group!.tag!,
      }),
      baseName
    )
  }

  return path.resolve(ctx.root, ctx.outputPath, baseName)
})

export const pluginClient = definePlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    group,
    urlType = false,
    exclude = [],
    include,
    override = [],
    transformers = {},
    dataReturnType = 'data',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    operations = false,
    baseURL,
    paramsCasing,
    clientType = 'function',
    parser = 'client',
    client = 'axios',
    importPath,
    contentType,
    bundle = false,
  } = options

  const resolvedImportPath = importPath ?? (!bundle ? `@kubb/plugin-client/clients/${client}` : undefined)

  const defaultGenerators = [
    clientType === 'staticClass' ? staticClassClientGenerator : clientType === 'class' ? classClientGenerator : clientGenerator,
    group && clientType === 'function' ? groupedClientGenerator : undefined,
    operations ? operationsGenerator : undefined,
  ].filter(Boolean)

  const generators = options.generators ?? defaultGenerators

  return {
    name: pluginClientName,
    options: {
      client,
      clientType,
      bundle,
      output,
      group,
      parser,
      dataReturnType,
      importPath: resolvedImportPath,
      paramsType,
      paramsCasing,
      pathParamsType,
      baseURL,
      urlType,
      transformers,
    },
    pre: [pluginOasName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()
      const baseURL = await this.getBaseURL()

      // pre add bundled fetch
      if (bundle && !this.plugin.options.importPath) {
        await this.addFile({
          baseName: 'fetch.ts',
          path: path.resolve(root, '.kubb/fetch.ts'),
          sources: [
            {
              name: 'fetch',
              value: resolveModuleSource(
                this.plugin.options.client === 'fetch' ? '@kubb/plugin-client/templates/clients/fetch' : '@kubb/plugin-client/templates/clients/axios',
              ).source,
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
            value: resolveModuleSource('@kubb/plugin-client/templates/config').source,
            isExportable: false,
            isIndexable: false,
          },
        ],
        imports: [],
        exports: [],
      })

      const operationGenerator = new OperationGenerator(
        baseURL
          ? {
              ...this.plugin.options,
              baseURL,
            }
          : this.plugin.options,
        {
          fabric: this.fabric,
          oas,
          pluginManager: this.pluginManager,
          events: this.events,
          plugin: this.plugin,
          contentType,
          exclude,
          include,
          override,
          mode,
        },
      )

      const files = await operationGenerator.build(...generators)

      await this.upsertFile(...files)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
