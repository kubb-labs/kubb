import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { version } from '../package.json'

export const server = new McpServer({
  name: 'Kubb',
  version,
})

server.tool(
  'generate',
  'generate from an OpenAPI/Swagger spec to TypeScript, Zod, React-Query, Axios, Faker, Cypress and more!',
  {
    name: z.string(),
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: 'text',
          text: name,
        },
      ],
    }
  },
)

export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.log('Server started and listening on stdio')
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
