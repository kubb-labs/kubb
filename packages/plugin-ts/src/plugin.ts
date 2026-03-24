import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import { createPlugin, type Group, getBarrelFiles, getMode, renderOperation, renderSchema } from '@kubb/core'
import type { Generator } from '@kubb/plugin-oas/generators'
import { typeGenerator } from './generators/index.ts'
import { getPreset } from './presets.ts'
import type { PluginTs } from './types.ts'

export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

export const pluginTs = createPlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    enumType = 'asConst',
    enumKeyCasing = 'none',
    optionalType = 'questionToken',
    arrayType = 'array',
    syntaxType = 'type',
    paramsCasing,
    compatibilityPreset = 'default',
    resolvers: userResolvers,
    transformers: userTransformers = [],
  } = options

  const { baseResolver, resolver, transformers, generators: presetGenerators } = getPreset(compatibilityPreset, {
    resolvers: userResolvers,
    transformers: userTransformers,
  })

  const generators: Array<Generator<PluginTs>> =
    presetGenerators.length > 0 || options.generators?.length
      ? [...(presetGenerators as Array<Generator<PluginTs>>), ...(options.generators ?? [])]
      : [typeGenerator]

  let resolveNameWarning = false

  return {
    name: pluginTsName,
    options: {
      output,
      optionalType,
      arrayType,
      enumType,
      enumKeyCasing,
      syntaxType,
      group,
      override,
      paramsCasing,
      compatibilityPreset,
      baseResolver,
      resolver,
      transformers,
    },
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
      if (!resolveNameWarning) {
        this.driver.events.emit('warn', 'Do not use resolveName for pluginTs, use resolverTs instead')
        resolveNameWarning = true
      }

      return resolver.default(name, type)
    },
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver, openInStudio } = this

      const root = path.resolve(config.root, config.output.path)
      const mode = getMode(path.resolve(root, output.path))

      if (!adapter) {
        throw new Error('Plugin cannot work without adapter being set')
      }

      await openInStudio({ ast: true })

      await walk(rootNode, {
        depth: 'shallow',
        async schema(schemaNode) {
          const writeTasks = generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const options = resolver.resolveOptions(schemaNode, { options: plugin.options, exclude, include, override })

              if (options === null) {
                return
              }

              await renderSchema(schemaNode, {
                options,
                adapter,
                config,
                fabric,
                Component: generator.Schema,
                plugin,
                driver,
                mode,
              })
            }
          })

          await Promise.all(writeTasks)
        },
        async operation(operationNode) {
          const writeTasks = generators.map(async (generator) => {
            if (generator.type === 'react' && generator.version === '2') {
              const options = resolver.resolveOptions(operationNode, { options: plugin.options, exclude, include, override })

              if (options === null) {
                return
              }

              await renderOperation(operationNode, {
                options,
                adapter,
                config,
                fabric,
                Component: generator.Operation,
                plugin,
                driver,
                mode,
              })
            }
          })

          await Promise.all(writeTasks)
        },
      })

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
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
