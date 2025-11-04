import path from 'node:path'
import { createPlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName, SchemaGenerator } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { fakerGenerator } from './generators/fakerGenerator.tsx'
import type { PluginFaker } from './types.ts'

export const pluginFakerName = 'plugin-faker' satisfies PluginFaker['name']

export const pluginFaker = createPlugin<PluginFaker>((options) => {
  const {
    output = { path: 'mocks', barrelType: 'named' },
    seed,
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    mapper = {},
    unknownType = 'any',
    emptySchemaType = unknownType,
    dateType = 'string',
    dateParser = 'faker',
    generators = [fakerGenerator].filter(Boolean),
    regexGenerator = 'faker',
    contentType,
  } = options

  return {
    name: pluginFakerName,
    options: {
      output,
      transformers,
      seed,
      dateType,
      unknownType,
      emptySchemaType,
      dateParser,
      mapper,
      override,
      regexGenerator,
      group,
    },
    pre: [pluginOasName, pluginTsName],
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
      const resolvedName = camelCase(name, {
        prefix: type ? 'create' : undefined,
        isFile: type === 'file',
      })

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
      await this.addFile(...schemaFiles)

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
      await this.addFile(...operationFiles)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
        logger: this.logger,
      })

      await this.addFile(...barrelFiles)
    },
  }
})
