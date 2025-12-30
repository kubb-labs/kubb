import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { cypressGenerator } from './generators'
import type { PluginCypress } from './types.ts'

export const pluginCypressName = 'plugin-cypress' satisfies PluginCypress['name']

export const pluginCypress = definePlugin<PluginCypress>((options) => {
  const {
    output = { path: 'cypress', barrelType: 'named' },
    group,
    dataReturnType = 'data',
    exclude = [],
    include,
    override = [],
    transformers = {},
    generators = [cypressGenerator].filter(Boolean),
    contentType,
    baseURL,
    paramsCasing = 'camelcase',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
  } = options

  return {
    name: pluginCypressName,
    options: {
      output,
      dataReturnType,
      group,
      baseURL,

      paramsCasing,
      paramsType,
      pathParamsType,
    },
    pre: [pluginOasName, pluginTsName].filter(Boolean),
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
              return `${camelCase(ctx.group)}Requests`
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
    resolveName(name, options) {
      const { role, prefix = '', suffix = '', casing } = options
      const strategy = casing || 'camelCase'
      
      // Build name with prefix/suffix, avoiding extra spaces
      const parts = [prefix, name, suffix].filter(Boolean)
      const nameWithAffixes = parts.join(' ')
      
      let resolvedName: string
      if (strategy === 'PascalCase') {
        resolvedName = pascalCase(nameWithAffixes, { isFile: role === 'file' })
      } else if (strategy === 'camelCase') {
        resolvedName = camelCase(nameWithAffixes, {
          isFile: role === 'file',
        })
      } else {
        // preserve
        resolvedName = nameWithAffixes
      }
      
      return transformers?.name?.(resolvedName, role) || resolvedName
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

      const files = await operationGenerator.build(...generators)
      await this.upsertFile(...files)

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
