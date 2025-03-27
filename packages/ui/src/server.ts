import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import type { AddressInfo, Server } from 'node:net'
import fs from 'node:fs'
import { Hono } from 'hono'
import { createServer } from 'node:http2'
import { z } from '@hono/zod-openapi'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { statusSchema } from './models/StatusSchema.ts'

import { version } from '../package.json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '../static')

const statusRoute = createRoute({
  method: 'get',
  path: '/status',
  response: {},
  responses: {
    200: {
      content: {
        'application/json': {
          schema: statusSchema,
        },
      },
      description: 'Retrieve the status',
    },
  },
})

const restartRoute = createRoute({
  method: 'post',
  path: '/restart',
  response: {},
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({}),
        },
      },
      description: 'Restart creation',
    },
  },
})

const stopRoute = createRoute({
  method: 'post',
  path: '/stop',
  response: {},
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({}),
        },
      },
      description: 'Stop creation',
    },
  },
})

type Meta = {
  name?: string
  percentages: Record<string, number>
}

type Options = {
  getMeta: () => Meta
  restart: () => void
  stop: () => void
}

function findOpenPort(preferredPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server: Server = createServer()

    server.listen(preferredPort, () => {
      server.close(() => resolve(preferredPort)) // If port is free, use it
    })

    server.on('error', async (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findOpenPort(preferredPort + 1)) // Try next port if in use
      } else {
        reject(err)
      }
    })
  })
}

export async function startServer(options: Options, listeningListener?: (info: AddressInfo) => void) {
  const { stop, restart, getMeta } = options

  const app = new Hono()
  const api = new OpenAPIHono()

  api.use('*', cors())

  api.openapi(statusRoute, (c) => {
    const meta = getMeta()

    return c.json(
      {
        name: meta.name,
        percentages: meta.percentages,
        executed: [],
      },
      200,
    )
  })

  api.openapi(stopRoute, (c) => {
    stop()

    return c.json({}, 200)
  })

  api.openapi(restartRoute, (c) => {
    restart()

    return c.json({}, 200)
  })

  api.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: version,
      title: 'Kubb ui',
    },
  })

  app.route('/api', api)

  // ✅ Serve static files manually (alternative to serveStatic)
  app.get('/*', async (c) => {
    const filePath = path.join(distPath, c.req.path) // Get requested file

    // If the file exists, serve it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return new Response(fs.readFileSync(filePath), {
        headers: { 'Content-Type': getMimeType(filePath) },
      })
    }

    // Otherwise, return "index.html" for SPA routing
    return new Response(fs.readFileSync(path.join(distPath, 'index.html')), {
      headers: { 'Content-Type': 'text/html' },
    })
  })

  // ✅ MIME type helper function
  const getMimeType = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }

  const port = await findOpenPort(5822)

  return serve(
    {
      fetch: app.fetch,
      port,
    },
    listeningListener,
  )
}
