import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { pluginOasName } from '@kubb/plugin-oas'

import { pluginFakerName } from '@kubb/plugin-faker'
import { pluginTsName } from '@kubb/plugin-ts'

import { OperationGenerator } from './OperationGenerator.tsx'
import { Mock, Operations } from './components/index.ts'

import type { Plugin } from '@kubb/core'
import type { PluginOas as SwaggerPluginOptions } from '@kubb/plugin-oas'
import type { PluginMsw } from './types.ts'

export const pluginMswName = 'plugin-msw' satisfies PluginMsw['name']

export const pluginMsw = createPlugin<PluginMsw>((options) => {
  const { output = { path: 'handlers' }, group, exclude = [], include, override = [], transformers = {}, templates } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginMswName,
    options: {
      extName: output.extName,
      templates: {
        operations: Operations.templates,
        mock: Mock.templates,
        ...templates,
      },
    },
    pre: [pluginOasName, pluginTsName, pluginFakerName],
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
        suffix: type ? 'handler' : undefined,
        isFile: type === 'file',
      })
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

      const files = await operationGenerator.build()
      await this.addFile(...files)

      if (this.config.output.write) {
        const indexFiles = await this.fileManager.getIndexFiles({
          root,
          output,
          files: this.fileManager.files,
          plugin: this.plugin,
          logger: this.logger,
        })

        await this.addFile(...indexFiles)
      }
    },
  }
})
