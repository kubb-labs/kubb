import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName, SchemaGenerator, registerDefaultResolvers } from '@kubb/plugin-oas'
import { typeGenerator } from './generators'
import { defaultTsResolvers } from './resolver.ts'
import type { PluginTs } from './types.ts'

export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginTsName, defaultTsResolvers)

// Register name resolver with core
registerNameResolver(pluginTsName, (name, type) => {
  return pascalCase(name, { isFile: type === 'file' })
})

// Register path resolver with core
registerPathResolver(pluginTsName, (baseName, mode, options, ctx) => {
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

export const pluginTs = definePlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    enumType = 'asConst',
    enumKeyCasing = 'none',
    enumSuffix = 'enum',
    dateType = 'string',
    unknownType = 'any',
    optionalType = 'questionToken',
    arrayType = 'array',
    emptySchemaType = unknownType,
    syntaxType = 'type',
    transformers = {},
    mapper = {},
    generators = [typeGenerator].filter(Boolean),
    contentType,
    UNSTABLE_NAMING,
  } = options

  // @deprecated Will be removed in v5 when collisionDetection defaults to true
  const usedEnumNames = {}

  return {
    name: pluginTsName,
    options: {
      output,
      transformers,
      dateType,
      optionalType,
      arrayType,
      enumType,
      enumKeyCasing,
      enumSuffix,
      unknownType,
      emptySchemaType,
      syntaxType,
      group,
      override,
      mapper,
      usedEnumNames,
    },
    pre: [pluginOasName],
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        events: this.events,
        plugin: this.plugin,
        contentType,
        include: undefined,
        override,
        mode,
        output: output.path,
      })

      const schemaFiles = await schemaGenerator.build(...generators)
      await this.upsertFile(...schemaFiles)

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
        UNSTABLE_NAMING,
      })

      const operationFiles = await operationGenerator.build(...generators)
      await this.upsertFile(...operationFiles)

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
