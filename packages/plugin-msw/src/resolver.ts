import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import type { MswOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the MSW plugin
 * Generates MSW handler names and file paths for operations
 */
export const defaultMswResolver = createResolver<MswOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `msw/${camelCase(tag)}` : 'msw'
    const name = camelCase(id)
    const pascalName = pascalCase(id)

    return {
      file: { baseName: `${pascalName}Handler.ts`, path: `${basePath}/${pascalName}Handler.ts` },
      outputs: {
        handler: { name: `${name}Handler` },
      },
    }
  },
})

export const defaultMswResolvers = [defaultMswResolver]
