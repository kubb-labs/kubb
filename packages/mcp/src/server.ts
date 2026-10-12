import { StdioTransport } from '@tmcp/transport-stdio'
import { McpServer } from 'tmcp'
import { JsonSchemaAdapter } from 'tmcp/adapter'
import { en } from 'zod/locales'
import * as z from 'zod/mini'
import { version } from '../package.json'
import { generateTool } from './tools/generate.ts'
import { initTool } from './tools/init.ts'
import { validateTool } from './tools/validate.ts'

/**
 * Describes each tool's input to MCP clients. `@tmcp/adapter-zod` imports the full `zod` build, so
 * this converts with Zod Mini instead. `io: 'input'` keeps fields with a default optional.
 */
class ZodMiniJsonSchemaAdapter extends JsonSchemaAdapter<z.ZodMiniType> {
  async toJsonSchema(schema: z.ZodMiniType) {
    // Zod's type also allows draft-4's boolean `exclusiveMaximum`, which the draft-7 target never emits.
    return z.toJSONSchema(schema, { target: 'draft-7', io: 'input' }) as Awaited<ReturnType<JsonSchemaAdapter<z.ZodMiniType>['toJsonSchema']>>
  }
}

/**
 * Builds the Kubb MCP server with the generate, validate, and init tools registered.
 *
 * @example
 * `const server = createMcpServer()`
 */
export function createMcpServer() {
  // Zod Mini ships without a locale, so validation errors would only say "Invalid input".
  z.config(en())
  const server = new McpServer({ name: 'Kubb', version }, { adapter: new ZodMiniJsonSchemaAdapter(), capabilities: { tools: {} } })
  server.tools([generateTool, validateTool, initTool])
  return server
}

/**
 * Starts the Kubb MCP server over stdio, the transport every local MCP client
 * (Claude, Copilot, editors) uses when it launches the server as a subprocess.
 */
export function startServer(): void {
  new StdioTransport(createMcpServer()).listen()
}
