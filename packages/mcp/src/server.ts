import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot'
import { StdioTransport } from '@tmcp/transport-stdio'
import { McpServer } from 'tmcp'
import { version } from '../package.json'
import { addTool } from './tools/add.ts'
import { diffTool } from './tools/diff.ts'
import { generateTool } from './tools/generate.ts'
import { initTool } from './tools/init.ts'
import { listTool } from './tools/list.ts'
import { removeTool } from './tools/remove.ts'
import { updateTool } from './tools/update.ts'
import { validateTool } from './tools/validate.ts'

/**
 * Builds the Kubb MCP server with a tool for every `kubb` command except `studio` and `mcp`:
 * generate, diff, validate, init, add, update, remove, and list.
 *
 * @example
 * `const server = createMcpServer()`
 */
export function createMcpServer() {
  const server = new McpServer({ name: 'Kubb', version }, { adapter: new ValibotJsonSchemaAdapter(), capabilities: { tools: {} } })
  server.tools([generateTool, diffTool, validateTool, initTool, addTool, updateTool, removeTool, listTool])
  return server
}

/**
 * Starts the Kubb MCP server over stdio, the transport every local MCP client
 * (Claude, Copilot, editors) uses when it launches the server as a subprocess.
 */
export function startServer() {
  const server = createMcpServer()
  new StdioTransport(server).listen()
  return server
}
