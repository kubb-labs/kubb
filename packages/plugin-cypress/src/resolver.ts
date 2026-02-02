import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import type { CypressOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the Cypress plugin
 * Generates Cypress test names and file paths for operations
 */
export const defaultCypressResolver = createResolver<CypressOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `cypress/${camelCase(tag)}` : 'cypress'
    const name = camelCase(id)
    const pascalName = pascalCase(id)

    return {
      file: { baseName: `${pascalName}.cy.ts`, path: `${basePath}/${pascalName}.cy.ts` },
      outputs: {
        test: { name },
      },
    }
  },
})

export const defaultCypressResolvers = [defaultCypressResolver]
