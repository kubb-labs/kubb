import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { resolveModuleSource } from '@kubb/core/utils'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginZodName } from '@kubb/plugin-zod'
import { operationsGenerator } from './generators'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import type { PluginClient } from './types.ts'

export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

export const pluginClient = definePlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    group,
    urlType = false,
    exclude = [],
    include,
    override = [],
    transformers = {},
    dataReturnType = 'data',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    operations = false,
    baseURL,
    paramsCasing,
    generators = [clientGenerator, group ? groupedClientGenerator : undefined, operations ? operationsGenerator : undefined].filter(Boolean),
    parser = 'client',
    client = 'axios',
    importPath,
    contentType,
    bundle = false,
  } = options

  const resolvedImportPath = importPath ?? (!bundle ? `@kubb/plugin-client/clients/${client}` : undefined)

  return {
    name: pluginClientName,
    options: {
      client,
      bundle,
      output,
      group,
      parser,
      dataReturnType,
      importPath: resolvedImportPath,
      paramsType,
      paramsCasing,
      pathParamsType,
      baseURL,
      urlType,
    },
    pre: [pluginOasName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: Group['name'] = group?.name
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
      const resolvedName = camelCase(name, { isFile: type === 'file' })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()
      const baseURL = await this.getBaseURL()

      // pre add bundled fetch
      const containsFetch = this.fabric.files.some((file) => file.baseName === 'fetch.ts')

      if (bundle && !this.plugin.options.importPath && !containsFetch) {
        await this.addFile({
          baseName: 'fetch.ts',
          path: path.resolve(root, '.kubb/fetch.ts'),
          sources: [
            {
              name: 'fetch',
              value: resolveModuleSource(
                this.plugin.options.client === 'fetch' ? '@kubb/plugin-client/templates/clients/fetch' : '@kubb/plugin-client/templates/clients/axios',
              ).source,
              isExportable: true,
              isIndexable: true,
            },
          ],
        })
      }

      const operationGenerator = new OperationGenerator(
        baseURL
          ? {
              ...this.plugin.options,
              baseURL,
            }
          : this.plugin.options,
        {
          fabric: this.fabric,
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType,
          exclude,
          include,
          override,
          mode,
        },
      )

      const files = await operationGenerator.build(...generators)

      await this.addFile(...files)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
        logger: this.logger,
      })

      await this.addFile(...barrelFiles)
    },
  }
})
