import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { SwrOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the SWR plugin
 * Generates SWR hook names and file paths for operations
 */
export const defaultSwrResolver = createResolver<SwrOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `hooks/${camelCase(tag)}` : 'hooks'
    const name = pascalCase(id)

    return {
      file: { baseName: `use${name}.ts`, path: `${basePath}/use${name}.ts` },
      outputs: {
        hook: { name: `use${name}` },
        hookMutation: { name: `use${name}Mutation` },
        key: { name: `get${name}Key` },
        keyType: {
          name: `${name}Key`,
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` },
        },
      },
    }
  },
})

export const defaultSwrResolvers = [defaultSwrResolver]
