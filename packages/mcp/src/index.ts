import process from 'node:process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { version } from '../package.json'
import { generateSchema } from './schemas/generateSchema.ts'
import { generate } from './tools/generate.ts'

export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    const server = new McpServer({
      name: 'Kubb',
      version,
    })

    server.tool('generate', 'generate an openAPI spec to a code snippet', generateSchema.shape, generate)

    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
