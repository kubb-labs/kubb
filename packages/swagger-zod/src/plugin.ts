import path from 'node:path'

import { createPlugin, FileManager, PluginManager } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { getGroupedByTagFiles } from '@kubb/swagger/utils'

import { OperationGenerator } from './OperationGenerator.tsx'
import { ZodBuilder } from './ZodBuilder.ts'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { OasTypes, PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-zod' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output = 'zod', group, exclude = [], include, override = [], transformers = {} } = options
  const template = group?.output ? group.output : `${output}/{{tag}}Controller`

  return {
    name: pluginName,
    options: {
      transformers,
      include,
      exclude,
      override,
    },
    pre: [swaggerPluginName],
    resolvePath(baseName, directory, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output)
      }

      if (options?.tag && group?.type === 'tag') {
        const tag = camelCase(options.tag)

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
      }

      return path.resolve(root, output, baseName)
    },
    resolveName(name, type) {
      const resolvedName = camelCase(`${name}Schema`)

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      const [swaggerPlugin]: [KubbPlugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [swaggerPluginName])

      const oas = await swaggerPlugin.api.getOas()
      const schemas = await swaggerPlugin.api.getSchemas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output))
      const builder = new ZodBuilder(this.plugin.options, { oas, pluginManager: this.pluginManager })

      builder.add(
        Object.entries(schemas).map(([name, schema]: [string, OasTypes.SchemaObject]) => ({ name, schema })),
      )

      if (mode === 'directory') {
        const mapFolderSchema = async ([name]: [string, OasTypes.SchemaObject]) => {
          const baseName = `${this.resolveName({ name, pluginKey: this.plugin.key, type: 'file' })}.ts` as const
          const resolvedPath = this.resolvePath({ baseName, pluginKey: this.plugin.key })
          const { source, imports } = builder.build(name)

          if (!resolvedPath) {
            return null
          }

          return this.addFile({
            path: resolvedPath,
            baseName,
            source,
            imports: [
              ...imports.map(item => ({ ...item, root: resolvedPath })),
              {
                name: ['z'],
                path: 'zod',
              },
            ],
            meta: {
              pluginKey: this.plugin.key,
            },
          })
        }

        const promises = Object.entries(schemas).map(mapFolderSchema)

        await Promise.all(promises)
      }

      if (mode === 'file') {
        const resolvedPath = this.resolvePath({ baseName: '', pluginKey: this.plugin.key })
        const { source } = builder.build()

        if (!resolvedPath) {
          return
        }

        await this.addFile({
          path: resolvedPath,
          baseName: output as KubbFile.BaseName,
          source,
          imports: [
            {
              name: ['z'],
              path: 'zod',
            },
          ],
          meta: {
            pluginKey: this.plugin.key,
          },
        })
      }

      const operationGenerator = new OperationGenerator(
        this.plugin.options,
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          exclude,
          include,
          override,
          mode,
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }

      const root = path.resolve(this.config.root, this.config.output.path)

      if (group?.type === 'tag') {
        const rootFiles = getGroupedByTagFiles({
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
      await this.fileManager.addIndexes({ root, output, extName: '.ts', meta: { pluginKey: this.plugin.key } })
    },
  }
})
