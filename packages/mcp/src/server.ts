import http from 'node:http'
import { ZodJsonSchemaAdapter } from '@tmcp/adapter-zod'
import { HttpTransport } from '@tmcp/transport-http'
import { StdioTransport } from '@tmcp/transport-stdio'
import { McpServer } from 'tmcp'
import { version } from '../package.json'
import { generateTool, initTool, validateTool } from './tools/index.ts'

export type ServerOptions = {
  port?: number
  host?: string
}

export function createMcpServer() {
  const server = new McpServer({ name: 'Kubb', version }, { adapter: new ZodJsonSchemaAdapter() })
  server.tools([generateTool, validateTool, initTool])
  return server
}

export async function startServer({ port, host = 'localhost' }: ServerOptions = {}) {
  const server = createMcpServer()

  if (port !== undefined) {
    const transport = new HttpTransport(server)
    const httpServer = http.createServer(async (req, res) => {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      const fetchReq = new Request(`http://${req.headers.host ?? `${host}:${port}`}${req.url}`, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
      })
      const fetchRes = await transport.respond(fetchReq)
      if (!fetchRes) {
        res.writeHead(404)
        res.end('Not Found')
        return
      }
      res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers))
      if (fetchRes.body) {
        const reader = fetchRes.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
      }
      res.end()
    })
    httpServer.listen(port, host, () => {
      console.log(`Kubb MCP server on http://${host}:${port}`)
    })
  } else {
    new StdioTransport(server).listen()
  }
}
