import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { findPetsByStatus, findPetsByStatusQueryParamsSchema } from './gen'

const server = new McpServer({
  name: 'Weather Service',
  version: '1.0.1',
})

server.tool('findPetsByStatus', 'find pets by status', findPetsByStatusQueryParamsSchema.unwrap().shape, async (params) => {
  const data = await findPetsByStatus(params)

  return {
    content: data.map((item) => {
      return {
        type: 'text',
        text: JSON.stringify(item),
      }
    }),
  }
})

// Start the server with stdio transport
async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('Server started and listening on stdio')
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

/**
 * npm install -g @anthropic-ai/claude-code
 * claude mcp add
 * claude
 * debug: npx @modelcontextprotocol/inspector npx tsx "/Users/stijnvanhulle/GitHub/kubb/examples/mcp/src/main.ts"
 */
