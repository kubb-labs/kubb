import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { ZodOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the Zod plugin
 * Generates zod schema names and file paths for operations and schemas
 */
export const defaultZodResolver = createResolver<ZodOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags, schema }: ResolverContext) => {
    // Handle schema resolution
    if (schema) {
      const name = camelCase(schema.name)
      const pascalName = pascalCase(schema.name)
      return {
        file: { baseName: `${pascalName}.ts`, path: `zod/${pascalName}.ts` },
        outputs: {
          pathParams: { name: `${name}PathParamsSchema` },
          queryParams: { name: `${name}QueryParamsSchema` },
          headerParams: { name: `${name}HeaderParamsSchema` },
          request: { name: `${name}Schema` },
          response: { name: `${name}Schema` },
        },
      }
    }

    // Handle operation resolution
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `zod/${camelCase(tag)}` : 'zod'
    const name = camelCase(id)
    const pascalName = pascalCase(id)

    return {
      file: { baseName: `${pascalName}.ts`, path: `${basePath}/${pascalName}.ts` },
      outputs: {
        pathParams: { name: `${name}PathParamsSchema` },
        queryParams: { name: `${name}QueryParamsSchema` },
        headerParams: { name: `${name}HeaderParamsSchema` },
        request: { name: `${name}MutationRequestSchema` },
        response: { name: `${name}QueryResponseSchema` },
      },
    }
  },
})

export const defaultZodResolvers = [defaultZodResolver]
