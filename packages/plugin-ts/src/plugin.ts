import path from 'node:path'
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { OperationGenerator, pluginOasName, SchemaGenerator } from '@kubb/plugin-oas'
import { typeGenerator } from './generators'
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
    enumKeyCasing = 'none',
    enumSuffix = 'enum',
    dateType = 'string',
    unknownType = 'any',
    optionalType = 'questionToken',
    arrayType = 'array',
    paramsCasing,
    emptySchemaType = unknownType,
    syntaxType = 'type',
    transformers = {},
    mapper = {},
    generators = [typeGenerator].filter(Boolean),
    contentType,
    UNSTABLE_NAMING,
  } = options

  const usedEnumNames = {}

  return {
    name: pluginTsName,
    options: {
      output,
      transformers,
      dateType,
      optionalType,
      arrayType,
      paramsCasing,
      enumType,
      enumKeyCasing,
      enumSuffix,
      unknownType,
      emptySchemaType,
      syntaxType,
      group,
      override,
      mapper,
      usedEnumNames,
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

      // Check if any client plugin exists and use its paramsCasing if not explicitly set
      let resolvedParamsCasing = paramsCasing
      if (!resolvedParamsCasing) {
        // Check all plugins in the pluginManager for paramsCasing
        const allPlugins = this.pluginManager.plugins
        for (const plugin of allPlugins) {
          if (plugin.options && typeof plugin.options === 'object') {
            const options = plugin.options as Record<string, unknown>
            // Check for paramsCasing in plugin-client
            if (plugin.name === 'plugin-client' && options.paramsCasing === 'camelcase') {
              resolvedParamsCasing = 'camelcase'
              break
            }
            // plugin-mcp always uses camelcase internally (hardcoded in mcpGenerator.tsx line 82)
            if (plugin.name === 'plugin-mcp') {
              resolvedParamsCasing = 'camelcase'
              break
            }
          }
        }
      }

      // Update the plugin options with resolved params casing
      this.plugin.options.paramsCasing = resolvedParamsCasing

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        events: this.events,
        plugin: this.plugin,
        contentType,
        include: undefined,
        override,
        mode,
        output: output.path,
      })

      const schemaFiles = await schemaGenerator.build(...generators)
      await this.upsertFile(...schemaFiles)

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
        UNSTABLE_NAMING,
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
