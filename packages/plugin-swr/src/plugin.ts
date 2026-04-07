import path from 'node:path'
import { camelCase, pascalCase } from '@internals/utils'
import { createFile, createSource, createText } from '@kubb/ast'
import type { FileNode } from '@kubb/ast/types'
import { createPlugin, getBarrelFiles, type UserGroup } from '@kubb/core'
import { pluginClientName } from '@kubb/plugin-client'
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source'
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source'
import { source as configSource } from '@kubb/plugin-client/templates/config.source'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { version } from '../package.json'
import { MutationKey, QueryKey } from './components'
import { mutationGenerator, queryGenerator } from './generators'
import type { PluginSwr } from './types.ts'

export const pluginSwrName = 'plugin-swr' satisfies PluginSwr['name']

export const pluginSwr = createPlugin<PluginSwr>((options) => {
  const {
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    transformers = {},
    query,
    mutation,
    client,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutationKey = MutationKey.getTransformer,
    queryKey = QueryKey.getTransformer,
    generators = [queryGenerator, mutationGenerator].filter(Boolean),
    paramsCasing,
    contentType,
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  return {
    name: pluginSwrName,
    version,
    options: {
      output,
      client: {
        bundle: client?.bundle,
        baseURL: client?.baseURL,
        client: clientName,
        clientType: client?.clientType ?? 'function',
        importPath: clientImportPath,
        dataReturnType: client?.dataReturnType ?? 'data',
        paramsCasing,
      },
      queryKey,
      query:
        query === false
          ? false
          : {
              importPath: 'swr',
              methods: ['get'],
              ...query,
            },
      mutationKey,
      mutation:
        mutation === false
          ? false
          : {
              importPath: 'swr/mutation',
              methods: ['post', 'put', 'delete', 'patch'],
              ...mutation,
            },
      parser,
      paramsType,
      pathParamsType,
      paramsCasing,
      group,
      exclude,
      include,
      override,
    },
    pre: [pluginOasName, pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = this.root
      const mode = pathMode ?? this.getMode(output)

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: UserGroup['name'] = group?.name
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
      const root = this.root
      const mode = this.getMode(output)
      const oas = await this.getOas()
      const baseURL = await this.getBaseURL()

      if (baseURL) {
        this.plugin.options.client.baseURL = baseURL
      }

      const hasClientPlugin = !!this.getPlugin(pluginClientName)

      if (this.plugin.options.client.bundle && !hasClientPlugin && !this.plugin.options.client.importPath) {
        // pre add bundled fetch
        await this.upsertFile(
          createFile({
            baseName: 'fetch.ts',
            path: path.resolve(root, '.kubb/fetch.ts'),
            sources: [
              createSource({
                name: 'fetch',
                nodes: [createText(this.plugin.options.client.client === 'fetch' ? fetchClientSource : axiosClientSource)],
                isExportable: true,
                isIndexable: true,
              }),
            ],
          }),
        )
      }

      if (!hasClientPlugin) {
        await this.addFile(
          createFile({
            baseName: 'config.ts',
            path: path.resolve(root, '.kubb/config.ts'),
            sources: [
              createSource({
                name: 'config',
                nodes: [createText(configSource)],
                isExportable: false,
                isIndexable: false,
              }),
            ],
          }),
        )
      }

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        oas,
        driver: this.driver,
        events: this.events,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

      const files = await operationGenerator.build(...generators)
      await this.upsertFile(...files)

      const barrelFiles = await getBarrelFiles(this.driver.fileManager.files as unknown as FileNode[], {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginName: this.plugin.name,
        },
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
