import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode, PackageManager, registerNameResolver, registerPathResolver } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName, registerDefaultResolvers, SchemaGenerator } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { operationsGenerator } from './generators'
import { zodGenerator } from './generators/zodGenerator.tsx'
import { defaultZodResolvers } from './resolver.ts'
import type { PluginZod } from './types.ts'

export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

// Register default resolvers for this plugin
registerDefaultResolvers(pluginZodName, defaultZodResolvers)

// Register name resolver with core
registerNameResolver(pluginZodName, (name, type) => {
  let resolvedName = camelCase(name, {
    suffix: type ? 'schema' : undefined,
    isFile: type === 'file',
  })

  if (type === 'type') {
    resolvedName = pascalCase(resolvedName)
  }

  return resolvedName
})

// Register path resolver with core
registerPathResolver(pluginZodName, (baseName, mode, options, ctx) => {
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
      baseName,
    )
  }

  return path.resolve(ctx.root, ctx.outputPath, baseName)
})

export const pluginZod = definePlugin<PluginZod>((options) => {
  const {
    output = { path: 'zod', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    dateType = 'string',
    unknownType = 'any',
    emptySchemaType = unknownType,
    typed = false,
    mapper = {},
    operations = false,
    mini = false,
    version = mini ? '4' : new PackageManager().isValidSync('zod', '>=4') ? '4' : '3',
    importPath = mini ? 'zod/mini' : version === '4' ? 'zod/v4' : 'zod',
    coercion = false,
    inferred = false,
    generators = [zodGenerator, operations ? operationsGenerator : undefined].filter(Boolean),
    wrapOutput = undefined,
    contentType,
  } = options

  // @deprecated Will be removed in v5 when collisionDetection defaults to true
  const usedEnumNames = {}

  return {
    name: pluginZodName,
    options: {
      output,
      transformers,
      include,
      exclude,
      override,
      typed,
      dateType,
      unknownType,
      emptySchemaType,
      mapper,
      importPath,
      coercion,
      operations,
      inferred,
      group,
      wrapOutput,
      version,
      mini,
      usedEnumNames,
    },
    pre: [pluginOasName, typed ? pluginTsName : undefined].filter(Boolean),
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()

      if (this.plugin.options.typed && this.plugin.options.version === '3') {
        // pre add bundled
        await this.addFile({
          baseName: 'ToZod.ts',
          path: path.resolve(root, '.kubb/ToZod.ts'),
          sources: [
            {
              name: 'ToZod',
              value: resolveModuleSource('@kubb/plugin-zod/templates/ToZod').source,
            },
          ],
          imports: [],
          exports: [],
        })
      }

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
