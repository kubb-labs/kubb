import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import type { ReactQueryOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the React Query plugin
 * Generates hook names, query keys, and file paths for operations
 *
 * Note: queryKeyType and mutationKeyType are placed in a separate types.ts file
 * to demonstrate the ability to have outputs in different files
 */
export const defaultReactQueryResolver = createResolver<ReactQueryOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `hooks/${camelCase(tag)}` : 'hooks'
    const name = pascalCase(id)

    return {
      file: {
        baseName: `use${name}.ts`,
        path: `${basePath}/use${name}.ts`,
      },
      outputs: {
        // Hooks (all in the main file)
        hook: { name: `use${name}` },
        hookSuspense: { name: `use${name}Suspense` },
        hookInfinite: { name: `use${name}Infinite` },
        hookSuspenseInfinite: { name: `use${name}SuspenseInfinite` },

        // Query key function (in main file)
        queryKey: { name: `get${name}QueryKey` },

        // Query key type (in separate types file)
        queryKeyType: {
          name: `${name}QueryKey`,
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` },
        },

        // Query options function (in main file)
        queryOptions: { name: `${camelCase(id)}QueryOptions` },

        // Mutation key function (in main file)
        mutationKey: { name: `get${name}MutationKey` },

        // Mutation key type (in separate types file)
        mutationKeyType: {
          name: `${name}MutationKey`,
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` },
        },

        // Mutation options function (in main file)
        mutationOptions: { name: `${camelCase(id)}MutationOptions` },
      },
    }
  },
})

/**
 * All default resolvers for the React Query plugin
 */
export const defaultReactQueryResolvers = [defaultReactQueryResolver]
