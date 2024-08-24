import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { pluginOasName } from '@kubb/plugin-oas'
import { getGroupedByTagFiles } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'

import { OperationGenerator } from './OperationGenerator.tsx'
import { Mutation, Operations, Query, QueryKey, QueryOptions } from './components/index.ts'

import type { Plugin } from '@kubb/core'
import type { PluginOas } from '@kubb/plugin-oas'
import { QueryImports } from './components/QueryImports.tsx'
import type { PluginReactQuery } from './types.ts'

export const pluginReactQueryName = 'plugin-react-query' satisfies PluginReactQuery['name']

export const pluginReactQuery = createPlugin<PluginReactQuery>((options) => {
  const {
    output = { path: 'hooks' },
    group,
    exclude = [],
    include,
    override = [],
    parser,
    suspense = {},
    infinite,
    transformers = {},
    dataReturnType = 'data',
    pathParamsType = 'inline',
    mutate = {},
    query = {},
    queryOptions = {},
    templates,
  } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginReactQueryName,
    options: {
      client: {
        importPath: '@kubb/plugin-client/client',
        ...options.client,
      },
      dataReturnType,
      pathParamsType,
      infinite: infinite
        ? {
            queryParam: 'id',
            initialPageParam: 0,
            cursorParam: undefined,
            ...infinite,
          }
        : false,
      suspense,
      query: query
        ? {
            queryKey: (key: unknown[]) => key,
            methods: ['get'],
            importPath: '@tanstack/react-query',
            ...query,
          }
        : false,
      queryOptions,
      mutate: mutate
        ? {
            variablesType: 'hook',
            methods: ['post', 'put', 'patch', 'delete'],
            ...mutate,
          }
        : false,
      templates: {
        mutation: Mutation.templates,
        query: Query.templates,
        queryOptions: QueryOptions.templates,
        queryKey: QueryKey.templates,
        queryImports: QueryImports.templates,
        operations: Operations.templates,
        ...templates,
      },
      parser,
    },
    pre: [pluginOasName, pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
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
      let resolvedName = camelCase(name)

      if (type === 'file' || type === 'function') {
        resolvedName = camelCase(name, {
          prefix: 'use',
          isFile: type === 'file',
        })
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
      const [swaggerPlugin]: [Plugin<PluginOas>] = PluginManager.getDependedPlugins<PluginOas>(this.plugins, [pluginOasName])

      const oas = await swaggerPlugin.api.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))

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

      const files = await operationGenerator.build()
      await this.addFile(...files)
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
        logger: this.logger,
      })
    },
  }
})
