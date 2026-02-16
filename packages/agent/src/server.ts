import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { Config } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { version } from '../package.json'
import type { ServerEvents } from './types.ts'

declare global {
  namespace NodeJS {
    interface Global {
      __KUBB_AGENT_CONTEXT__: {
        config: Config
        configPath: string
        version: string
        events: AsyncEventEmitter<ServerEvents>
        onGenerate: () => Promise<void>
      }
    }
  }
}

// Make globalThis accessible with proper typing
declare const globalThis: {
  __KUBB_AGENT_CONTEXT__?: {
    config: Config
    configPath: string
    version: string
    events: AsyncEventEmitter<ServerEvents>
    onGenerate: () => Promise<void>
  }
} & typeof global

export interface AgentServerOptions {
  port: number
  host: string
  configPath: string
  config: Config
  events: AsyncEventEmitter<ServerEvents>
  onGenerate: () => Promise<void>
}

export async function startServer({ port, host, configPath, config, events, onGenerate }: AgentServerOptions): Promise<void> {
  try {
    // Set up agent context via global before importing Nitro
    // This will be accessed by the routes
    globalThis.__KUBB_AGENT_CONTEXT__ = {
      config,
      configPath,
      version,
      events,
      onGenerate,
    }

    // Get the pre-built Nitro server listener
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const agentRoot = path.resolve(__dirname, '..')
    const outputDir = path.join(agentRoot, '.output')
    const serverDir = path.join(outputDir, 'server')

    let listener: any
    try {
      const mod = await import(path.join(serverDir, 'index.mjs'))
      listener = mod.default || mod
    } catch (error) {
      console.error('Failed to load pre-built Nitro server.')
      console.error('Please ensure @kubb/agent is built by running: pnpm install')
      throw error
    }

    // Create HTTP server with the Nitro listener
    const server = createServer(listener)

    // Start listening
    server.listen(port, host, () => {
      const address = server.address()
      const actualPort = typeof address === 'object' && address ? address.port : port
      const serverUrl = `http://${host}:${actualPort}`

      events.emit('server:start', serverUrl, path.relative(process.cwd(), configPath))
    })

    // Graceful shutdown
    process.on('SIGINT', () => {
      events.emit('server:shutdown')
      server.close(() => {
        events.emit('server:stopped')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('Failed to start agent server:', error)
    process.exit(1)
  }
}
