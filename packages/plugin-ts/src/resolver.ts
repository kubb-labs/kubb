import { resolve } from 'node:path'
import { type Group, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createResolver } from '@kubb/plugin-oas/resolvers'
import { pluginTsName } from './plugin.ts'
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
   * @deprecated will be removed in v5
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
        file: {
          baseName,
          path: filePath,
          imports: [],
          exports: [],
          sources: [],
          meta: {},
        },
        outputs: {
          type: { name: resolveName('') },
          pathParams: { name: resolveName('PathParams') },
          queryParams: { name: resolveName('QueryParams') },
          headerParams: { name: resolveName('HeaderParams') },
          request: { name: resolveName('Request') },
          response: { name: resolveName('Response') },
        },
      }
    },
    schema: ({ config, schema }) => {
      const root = resolve(config.root, config.output.path, outputPath)
      const mode = getMode(root)

      const baseName = `${pascalCase(schema.name, { isFile: true })}.ts` as const
      const schemaName = pascalCase(schema.name)

      return {
        file: {
          baseName: transformName ? (transformName(baseName, 'file') as KubbFile.File['baseName']) : baseName,
          path: mode === 'single' ? root : resolve(root, baseName),
          imports: [],
          exports: [],
          sources: [],
          meta: {
            // name: schemaName,
            // pluginKey: [pluginTsName],
          },
        },
        outputs: {
          type: {
            name: transformName ? transformName(schemaName, 'type') : schemaName,
          },
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
