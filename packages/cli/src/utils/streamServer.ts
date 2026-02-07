import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import * as clack from '@clack/prompts'
import type { Config, ConnectResponse, HealthResponse, KubbEvents, StreamEvents, StreamEventType } from '@kubb/core'
import { LogLevel } from '@kubb/core'
import { AsyncEventEmitter, serializePluginOptions } from '@kubb/core/utils'
import pc from 'picocolors'
import { version } from '../../package.json'
import type { Args } from '../commands/generate.ts'
import { createStreamLogger } from '../loggers/streamLogger.ts'
import { generate } from '../runners/generate.ts'

type StartStreamServerOptions = {
  port: number
  host: string
  configPath: string
  config: Config
  input?: string
  args: Args
}

export async function startStreamServer({ port, host, configPath, config, input, args }: StartStreamServerOptions): Promise<void> {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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
    if (req.url === '/health' && req.method === 'GET') {
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

      const body: ConnectResponse = {
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

    // Stream endpoint
    if (req.url === '/api/stream' && req.method === 'POST') {
      await handleGenerate(res, config, input, args)
      return
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  server.listen(port, host, () => {
    const address = server.address()
    const actualPort = typeof address === 'object' && address ? address.port : port
    const serverUrl = `http://${host}:${actualPort}`
    clack.log.success(pc.green(`Stream server started on ${pc.bold(serverUrl)}`))
    clack.log.info(pc.dim(`Config: ${path.relative(process.cwd(), configPath)}`))
    clack.log.info(pc.dim(`Connect: ${serverUrl}/api/info`))
    clack.log.info(pc.dim(`Stream: ${serverUrl}/api/stream`))
    clack.log.info(pc.dim(`Health: ${serverUrl}/health`))
    clack.log.step(pc.yellow('Waiting for requests... (Press Ctrl+C to stop)'))
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    clack.log.info('Shutting down stream server...')
    server.close(() => {
      clack.log.success('Server stopped')
      process.exit(0)
    })
  })
}

async function handleGenerate(res: ServerResponse, config: Config, input: string | undefined, args: Args): Promise<void> {
  // Create isolated event emitter for this request
  const events = new AsyncEventEmitter<KubbEvents>()
  const logLevel = LogLevel[args.logLevel as keyof typeof LogLevel] || 3

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  // Helper to send SSE events
  function send<T extends StreamEventType>(type: T, ...data: StreamEvents[T]) {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`)
  }

  // Install stream logger
  const streamLogger = createStreamLogger(res)
  await streamLogger.install(events, { logLevel })

  try {
    await generate({
      input,
      config,
      logLevel,
      events,
    })

    send('lifecycle:end')
  } catch (error) {
    send('error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
  } finally {
    res.end()
  }
}
