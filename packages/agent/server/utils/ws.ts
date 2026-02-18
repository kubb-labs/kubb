import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Config, InfoResponse, KubbEvents, SseEvent } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { serializePluginOptions } from '@kubb/core/utils'
import type { ConnectedMessage, DataMessage, PingMessage } from '~/types/agent.ts'
import { version } from '~~/package.json'

const WEBSOCKET_READY = 1
const WEBSOCKET_CONNECTING = 0

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function createWebsocket(url: string, options: Record<string, any>) {
  return new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(url, options)

    const cleanup = () => {
      ws.removeEventListener('open', onOpen)
      ws.removeEventListener('close', onClose)
      ws.removeEventListener('error', onError)
      resolve(null)
    }

    const onOpen = () => {
      console.log(`Connected to Kubb Studio on ${url}`)

      ws.removeEventListener('open', onOpen)
      ws.removeEventListener('error', onError)
      resolve(ws)
    }

    const onError = (error: Event) => {
      console.warn('Failed to connect to Kubb Studio:', error)
      cleanup()
    }

    const onClose = () => {
      console.warn('Connection to Kubb Studio closed')
      cleanup()
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('error', onError)

    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WEBSOCKET_CONNECTING) {
        ws.close()
        resolve(null)
      }
    }, 5000)
  })
}

export function setupEventsStream(ws: WebSocket, events: AsyncEventEmitter<KubbEvents>): void {
  const messageId = generateId()

  // Helper to send SSE-like events to WebSocket as DataMessages
  function sendDataMessage(sseEvent: SseEvent) {
    if (ws.readyState !== WEBSOCKET_READY) {
      return
    }

    const dataMessage: DataMessage = {
      type: 'data',
      id: messageId,
      event: sseEvent.type,
      payload: JSON.stringify(sseEvent),
    }

    try {
      ws.send(JSON.stringify(dataMessage))
    } catch (error) {
      console.warn('Failed to send data message to studio:', error)
    }
  }

  // Forward events to WebSocket stream similar to generate.post.ts
  events.on('plugin:start', (plugin: any) => {
    sendDataMessage({
      type: 'plugin:start',
      data: [plugin],
      timestamp: Date.now(),
    })
  })

  events.on('plugin:end', (plugin: any, meta: any) => {
    sendDataMessage({
      type: 'plugin:end',
      data: [plugin, meta],
      timestamp: Date.now(),
    })
  })

  events.on('files:processing:start', (files: any) => {
    sendDataMessage({
      type: 'files:processing:start',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  events.on('file:processing:update', (meta: any) => {
    sendDataMessage({
      type: 'file:processing:update',
      data: [
        {
          file: meta.file.path,
          processed: meta.processed,
          total: meta.total,
          percentage: meta.percentage,
        },
      ],
      timestamp: Date.now(),
    })
  })

  events.on('files:processing:end', (files: any) => {
    sendDataMessage({
      type: 'files:processing:end',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  events.on('info', (message: any, info: any) => {
    sendDataMessage({
      type: 'info',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('success', (message: any, info: any) => {
    sendDataMessage({
      type: 'success',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('warn', (message: any, info: any) => {
    sendDataMessage({
      type: 'warn',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('generation:start', (config: any) => {
    sendDataMessage({
      type: 'generation:start',
      data: [
        {
          name: config.name,
          plugins: config.plugins?.length || 0,
        },
      ],
      timestamp: Date.now(),
    })
  })

  events.on('generation:end', (config: any, files: any, sources: any) => {
    const sourcesRecord: Record<string, string> = {}
    sources.forEach((value: any, key: any) => {
      sourcesRecord[key] = value
    })
    sendDataMessage({
      type: 'generation:end',
      data: [config, files, sourcesRecord],
      timestamp: Date.now(),
    })
  })

  events.on('error', (error: Error) => {
    sendDataMessage({
      type: 'error',
      data: [
        {
          message: error.message,
          stack: error.stack,
        },
      ],
      timestamp: Date.now(),
    })
  })
}

export function sendPingMessage(ws: WebSocket) {
  try {
    ws.send(
      JSON.stringify({
        type: 'ping',
      } as PingMessage),
    )

    console.log('Sent ping message')
  } catch (error) {
    console.warn('Failed to send info message to studio:', error)
  }
}

export function sendConnectedMessage(ws: WebSocket, { config }: { config: Config }) {
  try {
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

    const infoResponse: InfoResponse = {
      version,
      configPath: process.env.KUBB_CONFIG || '',
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
        plugins: config.plugins?.map((plugin: any) => ({
          name: `@kubb/${plugin.name}`,
          options: serializePluginOptions(plugin.options),
        })),
      },
    }

    ws.send(
      JSON.stringify({
        type: 'connected',
        id: generateId(),
        payload: infoResponse,
      } as ConnectedMessage),
    )

    console.log('Sent connected message to Kubb Studio')
  } catch (error) {
    console.warn('Failed to send info message to studio:', error)
  }
}
