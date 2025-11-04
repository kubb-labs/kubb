import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { Generator, pluginOasName } from '@kubb/plugin-oas'
import { oasGenerator, typeGenerator } from './generators'
import type { PluginTs } from './types.ts'

export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

export const pluginTs = definePlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    enumType = 'asConst',
    enumSuffix = 'enum',
    dateType = 'string',
    unknownType = 'any',
    optionalType = 'questionToken',
    emptySchemaType = unknownType,
    syntaxType = 'type',
    transformers = {},
    oasType = false,
    mapper = {},
    generators = [typeGenerator, oasType === 'infer' ? oasGenerator : undefined].filter(Boolean),
    contentType,
  } = options

  return {
    name: pluginTsName,
    options: {
      output,
      transformers,
      dateType,
      optionalType,
      oasType,
      enumType,
      enumSuffix,
      unknownType,
      emptySchemaType,
      syntaxType,
      group,
      override,
      mapper,
      usedEnumNames: {},
    },
    pre: [pluginOasName],
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
      const resolvedName = pascalCase(name, { isFile: type === 'file' })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = getMode(path.resolve(root, output.path))
      const oas = await this.getOas()

      const generator = new Generator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
        output: output.path,
      })

      const files = await generator.build(...generators)
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
