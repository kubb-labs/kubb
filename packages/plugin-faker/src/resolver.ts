import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { FakerOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the Faker plugin
 * Generates faker function names and file paths for operations and schemas
 */
export const defaultFakerResolver = createResolver<FakerOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags, schema }: ResolverContext) => {
    // Handle schema resolution
    if (schema) {
      const name = camelCase(schema.name)
      const pascalName = pascalCase(schema.name)
      return {
        file: { baseName: `${pascalName}.ts`, path: `mocks/${pascalName}.ts` },
        outputs: {
          pathParams: { name: `${name}PathParams` },
          queryParams: { name: `${name}QueryParams` },
          headerParams: { name: `${name}HeaderParams` },
          request: { name: `${name}` },
          response: { name: `${name}` },
        },
      }
    }

    // Handle operation resolution
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `mocks/${camelCase(tag)}` : 'mocks'
    const name = camelCase(id)
    const pascalName = pascalCase(id)

    return {
      file: { baseName: `${pascalName}.ts`, path: `${basePath}/${pascalName}.ts` },
      outputs: {
        pathParams: { name: `${name}PathParams` },
        queryParams: { name: `${name}QueryParams` },
        headerParams: { name: `${name}HeaderParams` },
        request: { name: `${name}MutationRequest` },
        response: { name: `${name}QueryResponse` },
      },
    }
  },
})

export const defaultFakerResolvers = [defaultFakerResolver]
