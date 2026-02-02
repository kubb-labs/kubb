import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createResolver, type ResolverContext } from '@kubb/plugin-oas'
import type { McpOutputKeys } from './resolverTypes.ts'

/**
 * Default resolver for the MCP plugin
 * Generates MCP tool names and file paths for operations
 */
export const defaultMcpResolver = createResolver<McpOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }: ResolverContext) => {
    const id = operationId ?? 'unknown'
    const tag = tags?.[0]
    const basePath = tag ? `mcp/${camelCase(tag)}` : 'mcp'
    const name = camelCase(id)
    const pascalName = pascalCase(id)

    return {
      file: { baseName: `${pascalName}.ts`, path: `${basePath}/${pascalName}.ts` },
      outputs: {
        tool: { name },
      },
    }
  },
})

export const defaultMcpResolvers = [defaultMcpResolver]
