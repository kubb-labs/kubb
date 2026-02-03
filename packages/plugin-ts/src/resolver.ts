import { resolve } from 'node:path'
import { type Group, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
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
      const root = resolve(config.root, config.output.path, outputPath)

      const operationId = operation.getOperationId()
      const tags = operation.getTags()
      const tag = tags[0]?.name
      const path = operation.path

      const baseName = transformName
        ? (transformName(`${pascalCase(operationId, { isFile: true })}.ts`, 'file') as KubbFile.File['baseName'])
        : (`${pascalCase(operationId, { isFile: true })}.ts` as const)

      function resolvePath() {
        const mode = getMode(root)

        if (mode === 'single') {
          return root
        }

        if (group && (path || tag)) {
          const groupValue = group.type === 'path' ? path : tag

          if (groupValue) {
            const groupName = group.name
              ? group.name({ group: groupValue })
              : group.type === 'path'
                ? (groupValue.split('/')[1] ?? groupValue)
                : `${camelCase(groupValue)}Controller`

            return resolve(root, groupName, baseName)
          }
        }

        return resolve(root, baseName)
      }

      function resolveName(suffix: string) {
        const operationName = pascalCase(operationId)

        const name = suffix ? `${operationName}${suffix}` : operationName
        return transformName ? transformName(name, 'type') : name
      }

      return {
        file: {
          baseName,
          path: resolvePath(),
          imports: [],
          exports: [],
          sources: [],
          meta: {},
        },
        outputs: {
          type: { name: '' },
          enum: { name: '' },
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

      const baseName = transformName
        ? (transformName(`${pascalCase(schema.name, { isFile: true })}.ts`, 'file') as KubbFile.File['baseName'])
        : (`${pascalCase(schema.name, { isFile: true })}.ts` as const)

      function resolvePath() {
        const mode = getMode(root)

        return mode === 'single' ? root : resolve(root, baseName)
      }

      function resolveName(suffix: string) {
        const schemaName = pascalCase(schema.name)

        const name = suffix ? `${schemaName}${suffix}` : schemaName
        return transformName ? transformName(name, 'type') : name
      }

      return {
        file: {
          baseName,
          path: resolvePath(),
          imports: [],
          exports: [],
          sources: [],
          meta: {},
        },
        outputs: {
          type: {
            name: resolveName(''),
          },
          enum: {
            name: resolveName('Key'),
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
