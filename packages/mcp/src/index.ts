import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { version } from '../package.json'
import { type Config, type Plugin, safeBuild } from '@kubb/core'
import process from 'node:process'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export const server = new McpServer({
  name: 'Kubb',
  version,
})

server.tool(
  'kubbify',
  'kubbify an openAPI spec to a code snippet',
  {
    openApi: z.string().default('https://petstore.swagger.io/v2/swagger.json').describe('OpenAPI/Swagger spec'),
    plugin: z.enum(['typescript', 'react-query']).describe('Plugin to use'),
    operationId: z.string().nullable().optional().describe('Which operationId should be used'),
    // schemaName: z.string().nullable().optional().describe('Which schema should be used'),
  },
  async ({ plugin, openApi, operationId }) => {
    try {
      const definedConfig: Config = {
        root: process.cwd(),
        input: {
          data: openApi,
        },
        output: {
          path: './',
          write: false,
          barrelType: 'named',
        },
        plugins: [
          pluginOas({ validate: false, generators: [] }),
          pluginTs({
            output: {
              path: 'typescript.ts',
            },
            generators: plugin === 'typescript' ? undefined : [],
            include: [
              operationId
                ? {
                    type: 'operationId',
                    pattern: operationId,
                  }
                : undefined,
            ].filter(Boolean) as any[],
          }),
          pluginReactQuery({
            output: {
              path: 'react-query.ts',
            },
            generators: plugin === 'react-query' ? undefined : [],
            include: [
              operationId
                ? {
                    type: 'operationId',
                    pattern: operationId,
                  }
                : undefined,
            ].filter(Boolean) as any[],
          }),
        ].filter(Boolean) as Plugin[],
      }

      const { files, error } = await safeBuild({
        config: definedConfig,
      })

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: error.message,
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          // {
          //   type: 'resource',
          //   resource: {}
          // },
          {
            type: 'text',
            text: `Config: ${JSON.stringify(definedConfig, null, 2)}`,
          },
          {
            type: 'text',
            text: `Files: ${JSON.stringify(
              files
                .flatMap((file) => file.sources)
                .map((source) => source.value)
                .join('\n\n'),
              null,
              2,
            )}`,
          },
        ],
      }
    } catch (e) {
      const error = e as Error

      return {
        content: [
          {
            type: 'text',
            text: error.message,
          },
        ],
        isError: true,
      }
    }
  },
)

export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
