import { readFileSync } from 'node:fs'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Config, KubbEvents } from '../types.ts'
import { type AsyncEventEmitter, serializePluginOptions } from '../utils/index.ts'

/**
 * Typed SSE events sent by the Kubb server.
 * Follows the same tuple structure as {@link KubbEvents}.
 * Reusable in consumers like kubb-playground to parse incoming events.
 */
export interface SseEvents {
  'plugin:start': [plugin: { name: string }]
  'plugin:end': [plugin: { name: string }, meta: { duration: number; success: boolean }]
  'files:processing:start': [meta: { total: number }]
  'file:processing:update': [
    meta: {
      file: string
      processed: number
      total: number
      percentage: number
    },
  ]
  'files:processing:end': [meta: { total: number }]
  info: [message: string, info?: string]
  success: [message: string, info?: string]
  warn: [message: string, info?: string]
  error: [error: { message: string; stack?: string }]
  'generation:start': [config: { name?: string; plugins: number }]
  'generation:end': [Config: Config, files: Array<KubbFile.ResolvedFile>, sources: Record<KubbFile.Path, string>]
  'lifecycle:end': []
}

export type SseEventType = keyof SseEvents

export type SseEvent<T extends SseEventType = SseEventType> = {
  type: T
  data: SseEvents[T]
  timestamp: number
}

/**
 * API response types for the Kubb stream server endpoints.
 */

/** GET /api/health */
export type HealthResponse = {
  status: 'ok'
  version: string
  configPath: string
}

/** GET /api/info */
export type InfoResponse = {
  version: string
  configPath: string
  spec?: string
  config: {
    name?: string
    root: string
    input: {
      path?: string
    }
    output: {
      path: string
      write?: boolean
      extension?: Record<string, string>
      barrelType?: string | false
    }
    plugins?: Array<{
      name: string
      options: unknown
    }>
  }
}
/**
 * Same events asd KubbEvents but with server lifecycle events
 */
export type ServerEvents = KubbEvents & {
  /**
   * Emitted when the server starts successfully
   */
  'server:start': [serverUrl: string, configPath: string]
  /**
   * Emitted when the server is shutting down
   */
  'server:shutdown': []
  /**
   * Emitted when the server has stopped
   */
  'server:stopped': []
}

type ServerOptions = {
  port: number
  host: string
  configPath: string
  config: Config
  version: string
  /**
   * Event emitter for both server lifecycle and generation events
   */
  events: AsyncEventEmitter<ServerEvents>
  /**
   * Callback to handle code generation
   * Should use the events emitter to emit generation events
   */
  onGenerate: () => Promise<void>
}

export async function startServer({ port, host, configPath, config, version, events, onGenerate }: ServerOptions): Promise<Server> {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Helper to send SSE events
    function send<T extends SseEventType>(type: T, ...data: SseEvents[T]) {
      const event: SseEvent = { type, data, timestamp: Date.now() }

      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    // Forward specific events to SSE stream with proper transformations
    events.on('plugin:start', (plugin) => send('plugin:start', plugin))
    events.on('plugin:end', (plugin, meta) => send('plugin:end', plugin, meta))

    // Transform files:processing events to match StreamEvents format
    events.on('files:processing:start', (files) => send('files:processing:start', { total: files.length }))
    events.on('file:processing:update', (meta) => {
      send('file:processing:update', {
        file: meta.file.path,
        processed: meta.processed,
        total: meta.total,
        percentage: meta.percentage,
      })
    })
    events.on('files:processing:end', (files) => send('files:processing:end', { total: files.length }))

    // Simple passthrough events
    events.on('info', (message, info) => send('info', message, info))
    events.on('success', (message, info) => send('success', message, info))
    events.on('warn', (message, info) => send('warn', message, info))

    // Transform generation events to match StreamEvents format
    events.on('generation:start', (config) => {
      send('generation:start', {
        name: config.name,
        plugins: config.plugins?.length || 0,
      })
    })
    events.on('generation:end', (config, files, sources) => {
      // Convert Map to Record for JSON serialization
      const sourcesRecord: Record<string, string> = {}
      sources.forEach((value, key) => {
        sourcesRecord[key] = value
      })
      send('generation:end', config, files, sourcesRecord)
    })

    // Special handling for error events
    events.on('error', (error: Error) => {
      send('error', {
        message: error.message,
        stack: error.stack,
      })
    })

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    // Health check endpoint
    if (req.url === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      const body: HealthResponse = { status: 'ok', version, configPath: path.relative(process.cwd(), configPath) }

      res.end(JSON.stringify(body))

      return
    }

    // Connect endpoint - returns config metadata and OpenAPI spec
    if (req.url === '/api/info' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })

      // Read OpenAPI spec if available
      let specContent: string | undefined
      if (config && 'path' in config.input) {
        const specPath = path.resolve(process.cwd(), config.root, config.input.path)
        try {
          specContent = readFileSync(specPath, 'utf-8')
        } catch {
          // Spec file not found or unreadable
        }
      }

      const body: InfoResponse = {
        version,
        configPath: path.relative(process.cwd(), configPath),
        spec: specContent,
        config: {
          name: config.name,
          root: config.root,
          input: {
            path: 'path' in config.input ? config.input.path : undefined,
          },
          output: {
            path: config.output.path,
            write: config.output.write,
            extension: config.output.extension,
            barrelType: config.output.barrelType,
          },
          plugins: config.plugins?.map((plugin) => ({
            name: `@kubb/${plugin.name}`,
            options: serializePluginOptions(plugin.options),
          })),
        },
      }

      res.end(JSON.stringify(body))
      return
    }

    // Generate endpoint
    if (req.url === '/api/generate' && req.method === 'POST') {
      try {
        // Set SSE headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        await onGenerate()
      } catch (error) {
        send('error', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        })
      } finally {
        send('lifecycle:end')

        res.end()
      }

      return
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const address = server.address()
      const actualPort = typeof address === 'object' && address ? address.port : port
      const serverUrl = `http://${host}:${actualPort}`

      events.emit('server:start', serverUrl, path.relative(process.cwd(), configPath))

      resolve(server)
    })

    // Graceful shutdown
    process.on('SIGINT', () => {
      events.emit('server:shutdown')
      server.close(() => {
        events.emit('server:stopped')
        process.exit(0)
      })
    })
  })
}
