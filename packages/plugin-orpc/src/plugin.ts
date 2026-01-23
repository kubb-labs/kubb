import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginZodName } from '@kubb/plugin-zod'
import { baseGenerator, contractGenerator, routerGenerator } from './generators/index.ts'
import type { PluginOrpc } from './types.ts'

export const pluginOrpcName = 'plugin-orpc' satisfies PluginOrpc['name']

export const pluginOrpc = definePlugin<PluginOrpc>((options) => {
  const {
    output = { path: 'orpc', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    importPath = '@orpc/contract',
    zodImportPath = 'zod',
    router = false,
    routerName = 'router',
    contentType,
  } = options

  const defaultGenerators = [baseGenerator, contractGenerator, router ? routerGenerator : undefined].filter(Boolean)
  const generators = options.generators ?? defaultGenerators

  return {
    name: pluginOrpcName,
    options: {
      output,
      group,
      include,
      exclude,
      override,
      transformers,
      importPath,
      zodImportPath,
      router,
      routerName,
    },
    pre: [pluginOasName, pluginZodName],
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? getMode(path.resolve(root, output.path))

      if (mode === 'single') {
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
      const resolvedName = camelCase(name, {
        suffix: type ? 'contract' : undefined,
        isFile: type === 'file',
      })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        events: this.events,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

      const operationFiles = await operationGenerator.build(...generators)
      await this.upsertFile(...operationFiles)

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
