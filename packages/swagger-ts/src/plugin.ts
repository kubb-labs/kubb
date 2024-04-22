import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'

import { OperationGenerator } from './OperationGenerator.tsx'
import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'
export const pluginName = 'swagger-ts' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    output = { path: 'types' },
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
  } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginName,
    options: {
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
    },
    pre: [swaggerPluginName],
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
      const resolvedName = pascalCase(name, { isFile: type === 'file' })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath, { sanity: false })
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [swaggerPluginName])

      const oas = await swaggerPlugin.api.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        mediaType: swaggerPlugin.api.mediaType,
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
        mediaType: swaggerPlugin.api.mediaType,
        exclude,
        include,
        override,
        mode,
      })

      const operationFiles = await operationGenerator.build()
      await this.addFile(...operationFiles)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      await this.fileManager.addIndexes({
        root,
        output,
        meta: { pluginKey: this.plugin.key },
        logger: this.logger,
      })
    },
  }
})
