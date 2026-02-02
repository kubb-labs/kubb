import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'

import { pluginFakerName } from '@kubb/plugin-faker'
import { OperationGenerator, pluginOasName, registerDefaultResolvers } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { handlersGenerator, mswGenerator } from './generators'
import { defaultMswResolvers } from './resolver.ts'
import type { PluginMsw } from './types.ts'

export const pluginMswName = 'plugin-msw' satisfies PluginMsw['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginMswName, defaultMswResolvers)

// Register name resolver with core
registerNameResolver(pluginMswName, (name, type) => {
  return camelCase(name, {
    suffix: type ? 'handler' : undefined,
    isFile: type === 'file',
  })
})

// Register path resolver with core
registerPathResolver(pluginMswName, (baseName, mode, options, ctx) => {
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

export const pluginMsw = definePlugin<PluginMsw>((options) => {
  const {
    output = { path: 'handlers', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    handlers = false,
    parser = 'data',
    generators = [mswGenerator, handlers ? handlersGenerator : undefined].filter(Boolean),
    contentType,
    baseURL,
  } = options

  return {
    name: pluginMswName,
    options: {
      output,
      parser,
      group,
      baseURL,
      transformers,
    },
    pre: [pluginOasName, pluginTsName, parser === 'faker' ? pluginFakerName : undefined].filter(Boolean),
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
