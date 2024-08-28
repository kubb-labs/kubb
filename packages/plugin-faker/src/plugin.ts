import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { pluginOasName } from '@kubb/plugin-oas'

import { pluginTsName } from '@kubb/plugin-ts'

import { OperationGenerator } from './OperationGenerator.tsx'
import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { PluginOas } from '@kubb/plugin-oas'
import type { PluginFaker } from './types.ts'

export const pluginFakerName = 'plugin-faker' satisfies PluginFaker['name']

export const pluginFaker = createPlugin<PluginFaker>((options) => {
  const {
    output = { path: 'mocks' },
    seed,
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    mapper = {},
    dateType = 'string',
    unknownType = 'any',
    dateParser,
    regexGenerator = 'faker',
  } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginFakerName,
    options: {
      extName: output.extName,
      transformers,
      dateType,
      seed,
      unknownType,
      dateParser,
      mapper,
      override,
      regexGenerator,
    },
    pre: [pluginOasName, pluginTsName],
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
      const resolvedName = camelCase(name, {
        prefix: type ? 'create' : undefined,
        isFile: type === 'file',
      })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<PluginOas>] = PluginManager.getDependedPlugins<PluginOas>(this.plugins, [pluginOasName])

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

      const schemaFiles = await schemaGenerator.build()
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

      const operationFiles = await operationGenerator.build()
      await this.addFile(...operationFiles)

      if (this.config.output.write) {
        const barrelFiles = await this.fileManager.getBarrelFiles({
          root,
          output,
          files: this.fileManager.files,
          meta: {
            pluginKey: this.plugin.key,
          },
          logger: this.logger,
        })

        await this.addFile(...barrelFiles)
      }
    },
  }
})
