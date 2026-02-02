import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { TsOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the TypeScript plugin
 * Generates type names and file paths for operations and schemas
 */
export const defaultTsResolver = createResolver<TsOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags, schema }: ResolverContext) => {
    // Handle schema resolution (when generating types for OpenAPI schemas)
    if (schema) {
      const name = pascalCase(schema.name)
      return {
        file: { baseName: `${name}.ts`, path: `types/${name}.ts` },
        outputs: {
          pathParams: { name: `${name}PathParams` },
          queryParams: { name: `${name}QueryParams` },
          headerParams: { name: `${name}HeaderParams` },
          request: { name: `${name}Request` },
          response: { name },
        },
      }
    }

    // Handle operation resolution
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `types/${camelCase(tag)}` : 'types'
    const name = pascalCase(id)

    return {
      file: { baseName: `${name}.ts`, path: `${basePath}/${name}.ts` },
      outputs: {
        pathParams: { name: `${name}PathParams` },
        queryParams: { name: `${name}QueryParams` },
        headerParams: { name: `${name}HeaderParams` },
        request: { name: `${name}Request` },
        response: { name: `${name}Response` },
      },
    }
  },
})

/**
 * All default resolvers for the TypeScript plugin
 */
export const defaultTsResolvers = [defaultTsResolver]
