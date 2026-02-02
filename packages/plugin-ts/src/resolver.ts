import { resolve } from 'node:path'
import type { Group } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver } from '@kubb/plugin-oas'
import { pluginTsName } from './plugin.ts'
import type { TsOutputKeys } from './resolverTypes.ts'

export type TsResolverOptions = {
  /**
   * Output path for types
   * @default 'types'
   */
  outputPath?: string
  /**
   * Group configuration
   */
  group?: Group
  /**
   * Custom name transformer
   */
  transformName?: (name: string, type?: 'file' | 'function' | 'type' | 'const') => string
}

/**
 * Creates a TypeScript resolver with the given options
 */
export function createTsResolver(options: TsResolverOptions = {}) {
  const { outputPath = 'types', group, transformName } = options

  return createResolver<TsOutputKeys>({
    name: 'default-ts',
    resolve: (ctx, config) => {
      const root = resolve(config.root, config.output.path)

      // Handle schema resolution
      if (ctx.schema) {
        const baseName = `${pascalCase(ctx.schema.name, { isFile: true })}.ts` as const

        const resolveName = (suffix: string) => {
          const resolved = `${pascalCase(ctx.schema!.name)}${suffix}`
          return transformName ? transformName(resolved, 'type') : resolved
        }

        const filePath = resolve(root, outputPath, baseName)

        return {
          file: {
            path: filePath,
            baseName,
            sources: [],
            imports: [],
            exports: [],
            meta: {
              pluginKey: [pluginTsName],
            },
          },
          outputs: {
            schema: { name: resolveName('') },
          },
        }
      }

      // Handle operation resolution
      if (!ctx.operation) {
        throw new Error('Operation context required for operation resolution')
      }

      const operationId = ctx.operation.getOperationId()
      const tags = ctx.operation.getTags()
      const tag = tags[0]?.name
      const path = ctx.operation.path

      // Apply group logic
      let basePath = resolve(root, outputPath)
      if (group && (path || tag)) {
        const groupValue = group.type === 'path' ? path : tag
        if (groupValue) {
          const groupName = group.name
            ? group.name({ group: groupValue })
            : group.type === 'path'
              ? (groupValue.split('/')[1] ?? groupValue)
              : `${camelCase(groupValue)}Controller`
          basePath = resolve(basePath, groupName)
        }
      }

      const name = pascalCase(operationId)
      const fileName = transformName ? transformName(name, 'file') : name
      const baseName = `${fileName}.ts` as const

      const filePath = resolve(basePath, baseName)

      const resolveName = (suffix: string) => {
        const resolved = `${name}${suffix}`
        return transformName ? transformName(resolved, 'type') : resolved
      }

      return {
        file: {
          path: filePath,
          baseName,
          sources: [],
          imports: [],
          exports: [],
          meta: {
            pluginKey: [pluginTsName],
          },
        },
        outputs: {
          pathParams: { name: resolveName('PathParams') },
          queryParams: { name: resolveName('QueryParams') },
          headerParams: { name: resolveName('HeaderParams') },
          request: { name: resolveName('Request') },
          response: { name: resolveName('Response') },
        },
      }
    },
  })
}
