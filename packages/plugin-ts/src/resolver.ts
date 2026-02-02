import { resolve } from 'node:path'
import type { Group } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver } from '@kubb/plugin-oas/resolvers'
import type { PluginTs } from './types.ts'

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

  return createResolver<PluginTs>({
    name: 'default-ts',
    operation: ({ config, operation }) => {
      const root = resolve(config.root, config.output.path)

      const operationId = operation.getOperationId()
      const tags = operation.getTags()
      const tag = tags[0]?.name
      const path = operation.path

      // Apply group logic
      let basePath = outputPath
      if (group && (path || tag)) {
        const groupValue = group.type === 'path' ? path : tag
        if (groupValue) {
          const groupName = group.name
            ? group.name({ group: groupValue })
            : group.type === 'path'
              ? (groupValue.split('/')[1] ?? groupValue)
              : `${camelCase(groupValue)}Controller`
          basePath = resolve(outputPath, groupName)
        }
      }

      const name = pascalCase(operationId)
      const fileName = transformName ? transformName(name, 'file') : name
      const baseName = `${fileName}.ts`

      const filePath = resolve(root, basePath, baseName)

      const resolveName = (suffix: string) => {
        const resolved = `${name}${suffix}`
        return transformName ? transformName(resolved, 'type') : resolved
      }

      return {
        file: { baseName, path: filePath },
        outputs: {
          schema: { name: resolveName('') },
          pathParams: { name: resolveName('PathParams') },
          queryParams: { name: resolveName('QueryParams') },
          headerParams: { name: resolveName('HeaderParams') },
          request: { name: resolveName('Request') },
          response: { name: resolveName('Response') },
        },
      }
    },
    schema: ({ config, schema }) => {
      const root = resolve(config.root, config.output.path)

      const name = pascalCase(schema.name)
      const fileName = transformName ? transformName(name, 'file') : name
      const baseName = `${fileName}.ts`

      const filePath = resolve(root, outputPath, baseName)

      return {
        file: { baseName, path: filePath },
        outputs: {
          schema: { name: transformName ? transformName(name, 'type') : name },
          pathParams: { name: '' },
          queryParams: { name: '' },
          headerParams: { name: '' },
          request: { name: '' },
          response: { name: '' },
        },
      }
    },
  })
}
