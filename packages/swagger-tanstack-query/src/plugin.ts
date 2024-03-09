import path from 'node:path'

import { createPlugin, FileManager, PluginManager } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { getGroupedByTagFiles } from '@kubb/swagger/utils'
import { pluginName as swaggerTsPluginName } from '@kubb/swagger-ts'
import { pluginName as swaggerZodPluginName } from '@kubb/swagger-zod'

import { Mutation, Operations, Query, QueryKey, QueryOptions } from './components/index.ts'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-tanstack-query' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = [pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    output = { path: 'hooks' },
    group,
    exclude = [],
    include,
    override = [],
    framework = 'react',
    parser,
    suspense,
    infinite,
    transformers = {},
    dataReturnType = 'data',
    templates,
    query,
  } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginName,
    options: {
      framework,
      client: {
        importPath: '@kubb/swagger-client/client',
        ...options.client,
      },
      dataReturnType,
      infinite: infinite
        ? {
          queryParam: 'id',
          initialPageParam: 0,
          cursorParam: undefined,
          ...infinite,
        }
        : undefined,
      suspense,
      query,
      templates: {
        mutation: Mutation.templates,
        query: Query.templates,
        queryOptions: QueryOptions.templates,
        queryKey: QueryKey.templates,
        operations: Operations.templates,
        ...templates,
      },
      parser,
    },
    pre: [swaggerPluginName, swaggerTsPluginName, parser === 'zod' ? swaggerZodPluginName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (mode === 'file') {
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
      let resolvedName = camelCase(name)

      if (type === 'file' || type === 'function') {
        if (framework === 'react' || framework === 'vue') {
          resolvedName = camelCase(name, { prefix: 'use', isFile: type === 'file' })
        }

        if (framework === 'svelte' || framework === 'solid') {
          resolvedName = camelCase(name, { suffix: 'query', isFile: type === 'file' })
        }
      }
      if (type === 'type') {
        resolvedName = pascalCase(name)
      }

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async buildStart() {
      const [swaggerPlugin]: [Plugin<SwaggerPluginOptions>] = PluginManager.getDependedPlugins<SwaggerPluginOptions>(this.plugins, [swaggerPluginName])

      const oas = await swaggerPlugin.api.getOas()

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
        },
      )

      const files = await operationGenerator.build()
      await this.addFile(...files)
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath, { sanity: false })
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
          exportAs: group.exportAs || '{{tag}}Hooks',
          root,
          output,
        })

        await this.addFile(...rootFiles)
      }

      await this.fileManager.addIndexes({
        root,
        output,
        meta: { pluginKey: this.plugin.key },
      })
    },
  }
})
