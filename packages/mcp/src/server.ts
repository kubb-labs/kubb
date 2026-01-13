import process from 'node:process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { version } from '../package.json'
import { generateSchema } from './schemas/generateSchema.ts'
import { generate } from './tools/generate.ts'

/**
 * Kubb MCP Server
 *
 * Provides tools for building OpenAPI specifications using Kubb.
 */
export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    const server = new McpServer({
      name: 'Kubb',
      version,
    })

    // Build tool - runs Kubb build using @kubb/core
    // Wrapped to pass notification handler for real-time progress updates
    server.tool('generate', 'Generate OpenAPI spec helpers using Kubb configuration', generateSchema.shape, async (args) => {
      // Create notification handler that sends events back to the client
      const notificationHandler = {
        sendNotification: async (method: string, params: any) => {
          try {
            await transport.send({
              jsonrpc: '2.0',
              method,
              params,
            })
          } catch (error) {
            console.error('Failed to send notification:', error)
          }
        },
      }

      // Call build tool with notification handler
      return generate(args, notificationHandler)
    })

    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  }
}
