import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import type { SolidQueryOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the Solid Query plugin
 * Generates Solid Query hook names and file paths for operations
 */
export const defaultSolidQueryResolver = createResolver<SolidQueryOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `hooks/${camelCase(tag)}` : 'hooks'
    const name = pascalCase(id)

    return {
      file: { baseName: `create${name}.ts`, path: `${basePath}/create${name}.ts` },
      outputs: {
        hook: { name: `create${name}` },
        hookInfinite: { name: `create${name}Infinite` },
        queryKey: { name: `get${name}QueryKey` },
        queryKeyType: {
          name: `${name}QueryKey`,
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` },
        },
        queryOptions: { name: `${camelCase(id)}QueryOptions` },
        mutationKey: { name: `get${name}MutationKey` },
        mutationKeyType: {
          name: `${name}MutationKey`,
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` },
        },
        mutationOptions: { name: `${camelCase(id)}MutationOptions` },
      },
    }
  },
})

export const defaultSolidQueryResolvers = [defaultSolidQueryResolver]
