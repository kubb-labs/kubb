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

export type ServerOptions = {
  port?: number
  host?: string
}

export function createMcpServer() {
  const server = new McpServer({ name: 'Kubb', version }, { adapter: new ValibotJsonSchemaAdapter(), capabilities: { tools: {} } })
  server.tools([generateTool, validateTool, initTool])
  return server
}

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
}
