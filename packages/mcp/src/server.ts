import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot'
import { StdioTransport } from '@tmcp/transport-stdio'
import { McpServer } from 'tmcp'
import { version } from '../package.json'
import { generateTool } from './tools/generate.ts'
import { initTool } from './tools/init.ts'
import { validateTool } from './tools/validate.ts'

/**
 * Builds the Kubb MCP server with the generate, validate, and init tools registered.
 *
 * @example
 * `const server = createMcpServer()`
 */
export function createMcpServer() {
  const server = new McpServer({ name: 'Kubb', version }, { adapter: new ValibotJsonSchemaAdapter(), capabilities: { tools: {} } })
  server.tools([generateTool, validateTool, initTool])
  return server
}

/**
 * Starts the Kubb MCP server over stdio, the transport every local MCP client
 * (Claude, Copilot, editors) uses when it launches the server as a subprocess.
 */
export async function startServer() {
  new StdioTransport(createMcpServer()).listen()
}
