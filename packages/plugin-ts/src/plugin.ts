import path from 'node:path'

import { FileManager, type Group, PluginManager, createPlugin } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { OperationGenerator, SchemaGenerator, pluginOasName } from '@kubb/plugin-oas'

import type { Plugin } from '@kubb/core'
import type { PluginOas as SwaggerPluginOptions } from '@kubb/plugin-oas'
import { oasGenerator, typeGenerator } from './generators'
import type { PluginTs } from './types.ts'

export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

export const pluginTs = createPlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    enumType = 'asConst',
    enumSuffix = '',
    dateType = 'string',
    unknownType = 'any',
    optionalType = 'questionToken',
    transformers = {},
    oasType = false,
    mapper = {},
    generators = [typeGenerator, oasType === 'infer' ? oasGenerator : undefined].filter(Boolean),
  } = options

  return {
    name: pluginTsName,
    options: {
      output,
      transformers,
      dateType,
      optionalType,
      oasType,
      enumType,
      enumSuffix,
      // keep the used enumnames between SchemaGenerator and OperationGenerator per plugin(pluginKey)
      usedEnumNames: {},
      unknownType,
      override,
      mapper,
    },
    pre: [pluginOasName],
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (options?.tag && group?.type === 'tag') {
        const groupName: Group['name'] = group?.name ? group.name : (ctx) => `${ctx.group}Controller`

        return path.resolve(root, output.path, groupName({ group: camelCase(options.tag) }), baseName)
      }

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      const resolvedName = pascalCase(name, { isFile: type === 'file' })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [pluginOasName])

      const oas = await swaggerPlugin.context.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType: swaggerPlugin.context.contentType,
        include: undefined,
        override,
        mode,
        output: output.path,
      })

      const schemaFiles = await schemaGenerator.build(...generators)
      await this.addFile(...schemaFiles)

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType: swaggerPlugin.context.contentType,
        exclude,
        include,
        override,
        mode,
      })

      const operationFiles = await operationGenerator.build(...generators)
      await this.addFile(...operationFiles)

      const barrelFiles = await this.fileManager.getBarrelFiles({
        type: output.barrelType ?? 'named',
        root,
        output,
        files: this.fileManager.files,
        meta: {
          pluginKey: this.plugin.key,
        },
        logger: this.logger,
      })

      await this.addFile(...barrelFiles)
    },
  }
})
