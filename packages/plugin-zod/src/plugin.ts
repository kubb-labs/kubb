import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName, SchemaGenerator } from '@kubb/plugin-oas'
import { getGroupedByTagFiles } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'

import type { Plugin } from '@kubb/core'
import type { PluginOas as SwaggerPluginOptions } from '@kubb/plugin-oas'
import { Operations } from './components/Operations.tsx'
import type { PluginZod } from './types.ts'
import { zodParser } from './SchemaGenerator.tsx'

export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

export const pluginZod = createPlugin<PluginZod>((options) => {
  const {
    output = { path: 'zod' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    dateType = 'string',
    unknownType = 'any',
    typed = false,
    typedSchema = false,
    mapper = {},
    templates,
    importPath = 'zod',
    coercion = false,
  } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginZodName,
    options: {
      extName: output.extName,
      transformers,
      include,
      exclude,
      override,
      typed,
      typedSchema,
      dateType,
      unknownType,
      mapper,
      importPath,
      coercion,
      templates: {
        operations: Operations.templates,
        ...templates,
      },
    },
    pre: [pluginOasName, typed ? pluginTsName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (options?.tag && group?.type === 'tag') {
        const tag = camelCase(options.tag)

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
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
    async writeFile(path, source) {
      if (!path.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(path, source, { sanity: false })
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [pluginOasName])

      const oas = await swaggerPlugin.api.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType: swaggerPlugin.api.contentType,
        include: undefined,
        override,
        mode,
        output: output.path,
      })

      const schemaFiles = await schemaGenerator.build(zodParser)
      await this.addFile(...schemaFiles)

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType: swaggerPlugin.api.contentType,
        exclude,
        include,
        override,
        mode,
      })

      const operationFiles = await operationGenerator.build(zodParser)
      await this.addFile(...operationFiles)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (group?.type === 'tag') {
        const rootFiles = await getGroupedByTagFiles({
          logger: this.logger,
          files: this.fileManager.files,
          plugin: this.plugin,
          template,
          exportAs: group.exportAs || '{{tag}}Schemas',
          root,
          output,
        })

        await this.addFile(...rootFiles)
      }

      await this.fileManager.addIndexes({
        root,
        output,
        meta: { pluginKey: this.plugin.key },
        logger: this.logger,
      })
    },
  }
})
