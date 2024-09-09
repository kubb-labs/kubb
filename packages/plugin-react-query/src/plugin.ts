import path from 'node:path'

import { FileManager, PluginManager, createPlugin } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { renderTemplate } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'

import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'

import type { Plugin } from '@kubb/core'
import type { PluginOas } from '@kubb/plugin-oas'
import { infiniteQueryGenerator, mutationGenerator, queryGenerator, suspenseQueryGenerator } from './generators'
import type { PluginReactQuery } from './types.ts'

export const pluginReactQueryName = 'plugin-react-query' satisfies PluginReactQuery['name']

export const pluginReactQuery = createPlugin<PluginReactQuery>((options) => {
  const {
    output = { path: 'hooks' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    suspense = {},
    infinite,
    transformers = {},
    pathParamsType = 'inline',
    mutation = {},
    query = {},
  } = options
  const template = group?.output ? group.output : `${output.path}/{{tag}}Controller`

  return {
    name: pluginReactQueryName,
    output: {
      exportType: 'barrelNamed',
      ...output,
    },
    options: {
      baseURL: undefined,
      client: {
        importPath: '@kubb/plugin-client/client',
        dataReturnType: 'data',
        pathParamsType: 'inline',
        ...options.client,
      },
      infinite: infinite
        ? {
            queryParam: 'id',
            initialPageParam: 0,
            cursorParam: undefined,
            ...infinite,
          }
        : false,
      suspense,
      query: {
        key: (key: unknown[]) => key,
        methods: ['get'],
        importPath: '@tanstack/react-query',
        ...query,
      },
      mutation: {
        methods: ['post', 'put', 'patch', 'delete'],
        importPath: '@tanstack/react-query',
        ...mutation,
      },
      pathParamsType,
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

      const oas = await swaggerPlugin.context.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))
      const baseURL = await swaggerPlugin.context.getBaseURL()

      const operationGenerator = new OperationGenerator(
        {
          ...this.plugin.options,
          baseURL,
        },
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.context.contentType,
          exclude,
          include,
          override,
          mode,
        },
      )

      const files = await operationGenerator.build(queryGenerator, suspenseQueryGenerator, infiniteQueryGenerator, mutationGenerator)
      await this.addFile(...files)

      if (this.config.output.exportType) {
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
