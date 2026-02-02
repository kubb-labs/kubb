import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName, registerDefaultResolvers } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { cypressGenerator } from './generators'
import { defaultCypressResolvers } from './resolver.ts'
import type { PluginCypress } from './types.ts'

export const pluginCypressName = 'plugin-cypress' satisfies PluginCypress['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginCypressName, defaultCypressResolvers)

// Register name resolver with core
registerNameResolver(pluginCypressName, (name, type) => {
  return camelCase(name, { isFile: type === 'file' })
})

// Register path resolver with core
registerPathResolver(pluginCypressName, (baseName, mode, options, ctx) => {
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
          return `${camelCase(groupCtx.group)}Requests`
        }

    return path.resolve(
      ctx.root,
      ctx.outputPath,
      groupName({
        group: ctx.group.type === 'path' ? options!.group!.path! : options!.group!.tag!,
      }),
      baseName,
    )
  }

  return path.resolve(ctx.root, ctx.outputPath, baseName)
})

export const pluginCypress = definePlugin<PluginCypress>((options) => {
  const {
    output = { path: 'cypress', barrelType: 'named' },
    group,
    dataReturnType = 'data',
    exclude = [],
    include,
    override = [],
    transformers = {},
    generators = [cypressGenerator].filter(Boolean),
    contentType,
    baseURL,
    paramsCasing = 'camelcase',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
  } = options

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
      transformers,
    },
    pre: [pluginOasName, pluginTsName].filter(Boolean),
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()

      const operationGenerator = new OperationGenerator(this.plugin.options, {
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
      })

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
