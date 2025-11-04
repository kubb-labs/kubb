import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'

import { pluginFakerName } from '@kubb/plugin-faker'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { handlersGenerator, mswGenerator } from './generators'
import type { PluginMsw } from './types.ts'

export const pluginMswName = 'plugin-msw' satisfies PluginMsw['name']

export const pluginMsw = definePlugin<PluginMsw>((options) => {
  const {
    output = { path: 'handlers', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    handlers = false,
    parser = 'data',
    generators = [mswGenerator, handlers ? handlersGenerator : undefined].filter(Boolean),
    contentType,
    baseURL,
  } = options

  return {
    name: pluginMswName,
    options: {
      output,
      parser,
      group,
      baseURL,
    },
    pre: [pluginOasName, pluginTsName, parser === 'faker' ? pluginFakerName : undefined].filter(Boolean),
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
      const resolvedName = camelCase(name, {
        suffix: type ? 'handler' : undefined,
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
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

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
