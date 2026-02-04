import { resolve } from 'node:path'
import { type Group, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createResolver, type Output } from '@kubb/plugin-oas/resolvers'
import type { PluginTs } from './types.ts'

type Options = {
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
export function createTsResolver(options: Options = {}) {
  const { outputPath = 'types', group, transformName } = options

  return createResolver<PluginTs>({
    name: 'default-ts',
    operation: ({ operation, config }) => {
      const root = resolve(config.root, config.output.path, outputPath)

      const operationId = operation.getOperationId()
      const tags = operation.getTags()
      const tag = tags[0]?.name
      const path = operation.path

      const baseName = `${transformName?.(pascalCase(operationId, { isFile: true }), 'file') || pascalCase(operationId, { isFile: true })}.ts` as const

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
        return transformName?.(name, 'type') || name
      }

      const file: KubbFile.File = {
        baseName,
        path: resolvePath(),
        imports: [],
        exports: [],
        sources: [],
        meta: {},
      }

      const statusCodes = operation.getResponseStatusCodes()
      const statusCodeOutputs = statusCodes.reduce<Record<string, Output>>((acc: Record<string, Output>, statusCode: string) => {
        const suffix = statusCode === 'default' ? 'Default' : `Status${statusCode}`
        acc[statusCode] = { name: resolveName(suffix), file }
        return acc
      }, {})

      return {
        file,
        outputs: {
          default: { name: resolveName(''), file },
          ...statusCodeOutputs,
          query: { name: resolveName('Query'), file },
          mutation: { name: resolveName('Mutation'), file },
          pathParams: { name: resolveName('PathParams'), file },
          queryParams: { name: resolveName('QueryParams'), file },
          headerParams: { name: resolveName('HeaderParams'), file },
          request: { name: resolveName('Request'), file },
          response: { name: resolveName('Response'), file },
          responses: { name: resolveName('Responses'), file },
          responseData: { name: resolveName('ResponseData'), file },
        },
      }
    },
    schema: ({ schema, config }) => {
      const root = resolve(config.root, config.output.path, outputPath)

      const baseName = `${transformName?.(pascalCase(schema.name, { isFile: true }), 'file') || pascalCase(schema.name, { isFile: true })}.ts` as const

      function resolvePath() {
        const mode = getMode(root)

        return mode === 'single' ? root : resolve(root, baseName)
      }

      function resolveName(suffix: string) {
        const schemaName = pascalCase(schema.name)

        const name = suffix ? `${schemaName}${suffix}` : schemaName
        return transformName?.(name, 'type') || name
      }

      const file: KubbFile.File = {
        baseName,
        path: resolvePath(),
        imports: [],
        exports: [],
        sources: [],
        meta: {},
      }

      return {
        file,
        outputs: {
          default: { name: resolveName(''), file },
          type: { name: resolveName(''), file },
          enum: { name: resolveName('Key'), file },
        },
      }
    },
  })
}
