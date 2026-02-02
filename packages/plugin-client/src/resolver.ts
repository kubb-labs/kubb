import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { ClientOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the Client plugin
 * Generates client function names and file paths for operations
 */
export const defaultClientResolver = createResolver<ClientOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `clients/${camelCase(tag)}` : 'clients'
    const name = camelCase(id)
    const pascalName = pascalCase(id)

    return {
      file: { baseName: `${pascalName}.ts`, path: `${basePath}/${pascalName}.ts` },
      outputs: {
        client: { name },
        url: { name: `get${pascalName}Url` },
      },
    }
  },
})

export const defaultClientResolvers = [defaultClientResolver]
