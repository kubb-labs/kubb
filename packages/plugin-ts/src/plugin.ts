import path from 'node:path'
import { camelCase } from '@internals/utils'
import { walk } from '@kubb/ast'
import { buildOperation, buildSchema, createPlugin, type Group, getBarrelFiles, getMode } from '@kubb/core'
import { OperationGenerator, pluginOasName, SchemaGenerator } from '@kubb/plugin-oas'
import { typeGenerator, typeGeneratorV2 } from './generators'
import { resolverTs } from './resolverTs.ts'
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
    enumSuffix = 'enum',
    dateType = 'string',
    integerType = 'number',
    unknownType = 'any',
    optionalType = 'questionToken',
    arrayType = 'array',
    emptySchemaType = unknownType,
    syntaxType = 'type',
    transformers = {},
    paramsCasing,
    generators = [typeGenerator, typeGeneratorV2].filter(Boolean),
    contentType,
    UNSTABLE_NAMING,
  } = options

  // @deprecated Will be removed in v5 when collisionDetection defaults to true
  const usedEnumNames = {}

  return {
    name: pluginTsName,
    options: {
      output,
      transformers,
      dateType,
      integerType,
      optionalType,
      arrayType,
      enumType,
      enumKeyCasing,
      enumSuffix,
      unknownType,
      emptySchemaType,
      syntaxType,
      group,
      override,
      paramsCasing,
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
      const resolvedName = resolverTs.default(name, type)

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async install() {
      const { config, fabric, plugin, adapter, rootNode, driver, openInStudio } = this

      const root = path.resolve(config.root, config.output.path)
      const mode = getMode(path.resolve(root, output.path))

      if (adapter) {
        await openInStudio({ ast: true })

        await walk(
          rootNode,
          {
            async schema(schemaNode) {
              const writeTasks = generators.map(async (generator) => {
                if (generator.type === 'react' && generator.version === '2') {
                  const options = resolverTs.resolveOptions(schemaNode, { options: plugin.options, exclude, include, override })

                  if (options === null) {
                    return
                  }

                  await buildSchema(schemaNode, {
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
                  const options = resolverTs.resolveOptions(operationNode, { options: plugin.options, exclude, include, override })

                  if (options === null) {
                    return
                  }

                  await buildOperation(operationNode, {
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
          },
          { depth: 'shallow' },
        )

        const barrelFiles = await getBarrelFiles(this.fabric.files, {
          type: output.barrelType ?? 'named',
          root,
          output,
          meta: {
            pluginName: this.plugin.name,
          },
        })

        await this.upsertFile(...barrelFiles)

        return
      }

      // v1 flow

      const oas = await this.getOas()

      const schemaGenerator = new SchemaGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        driver: this.driver,
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
        driver: this.driver,
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
          pluginName: this.plugin.name,
        },
      })

      await this.upsertFile(...barrelFiles)
    },
  }
})
