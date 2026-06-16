import http from 'node:http'
import { createRequestListener } from '@remix-run/node-fetch-server'
import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot'
import { HttpTransport } from '@tmcp/transport-http'
import { StdioTransport } from '@tmcp/transport-stdio'
import { McpServer } from 'tmcp'
import { version } from '../package.json'
import { generateTool } from './tools/generate.ts'
import { initTool } from './tools/init.ts'
import { validateTool } from './tools/validate.ts'

/**
 * Network options for the MCP server.
 *
 * When `port` is omitted the server runs over stdio instead of HTTP, so `host`
 * has no effect in that case.
 */
export type ServerOptions = {
  /**
   * TCP port to listen on. When unset, the server uses stdio rather than HTTP.
   */
  port?: number
  /**
   * Host to bind the HTTP listener to. Only used when `port` is set.
   *
   * @default 'localhost'
   */
  host?: string
}

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
 * Starts the Kubb MCP server.
 *
 * With no `port` it listens over stdio. With a `port` it serves HTTP on `/mcp`
 * and shuts the listener down on SIGINT and SIGTERM.
 */
export async function startServer({ port, host = 'localhost' }: ServerOptions = {}) {
  const server = createMcpServer()

  if (port === undefined) {
    new StdioTransport(server).listen()
    return
  }

  const transport = new HttpTransport(server, { path: '/mcp' })
  const httpServer = http.createServer(
    createRequestListener(async (request) => {
      const response = await transport.respond(request)
      return response ?? new Response('Not Found', { status: 404 })
    }),
  )
  httpServer.listen(port, host, () => {
    console.log(`Kubb MCP server on http://${host}:${port}`)
  })

  const closeServer = () => httpServer.close()
  process.once('SIGINT', closeServer)
  process.once('SIGTERM', closeServer)
  httpServer.once('close', () => {
    process.off('SIGINT', closeServer)
    process.off('SIGTERM', closeServer)
  })
}
