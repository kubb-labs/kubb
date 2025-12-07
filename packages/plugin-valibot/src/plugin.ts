import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName, SchemaGenerator } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { operationsGenerator } from './generators'
import { valibotGenerator } from './generators/valibotGenerator.tsx'
import type { PluginValibot } from './types.ts'

export const pluginValibotName = 'plugin-valibot' satisfies PluginValibot['name']

export const pluginValibot = definePlugin<PluginValibot>((options) => {
  const {
    output = { path: 'valibot', barrelType: 'named' },
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
    importPath = 'valibot',
    inferred = false,
    generators = [valibotGenerator, operations ? operationsGenerator : undefined].filter(Boolean),
    contentType,
  } = options

  const usedEnumNames = {}

  return {
    name: pluginValibotName,
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
      operations,
      inferred,
      group,
      usedEnumNames,
    },
    pre: [pluginOasName, typed ? pluginTsName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: Group['name'] = group?.name
          ? group.name
          : (ctx) => {
              if (group?.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }
              return `${camelCase(ctx.group)}Controller`
            }

        return path.resolve(
          root,
          output.path,
          groupName({
            group: group.type === 'path' ? options.group.path! : options.group.tag!,
          }),
          baseName,
        )
      }

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      let resolvedName = camelCase(name, {
        suffix: type ? 'schema' : undefined,
        isFile: type === 'file',
      })

      if (type === 'type') {
        resolvedName = pascalCase(resolvedName)
      }

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
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
        logger: this.logger,
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
