import type { KubbEvents, SseEvent } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import type { AgentMessage } from '~/types/agent.ts'
import { logger } from './logger.ts'

const WEBSOCKET_READY = 1
const WEBSOCKET_CONNECTING = 0

export async function createWebsocket(url: string, options: Record<string, any>): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(url, options)

    const cleanup = () => {
      ws.removeEventListener('open', onOpen)
      ws.removeEventListener('close', onClose)
      ws.removeEventListener('error', onError)
      resolve(null)
    }

    const onOpen = () => {
      logger.success(`Connected to Kubb Studio on "${url}"`)

      ws.removeEventListener('open', onOpen)
      ws.removeEventListener('error', onError)

      resolve(ws)
    }

    const onError = (error: Event) => {
      logger.error('Failed to connect to Kubb Studio')
      cleanup()

      reject(error)
    }

    const onClose = () => {
      logger.warn('Connection to Kubb Studio closed')

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

/**
 * Send a message to Kubb Studio via WebSocket
 */
export function sendAgentMessage(ws: WebSocket, message: AgentMessage): void {
  try {
    if (ws.readyState !== WEBSOCKET_READY) {
      return
    }

    ws.send(JSON.stringify(message))
  } catch (error: any) {
    logger.error('Failed to send message to Kubb Studio')
  }
}

/**
 * Set up event listeners on the KubbEvents emitter to forward events to Kubb Studio via WebSocket
 */
export function setupEventsStream(ws: WebSocket, events: AsyncEventEmitter<KubbEvents>): void {
  function sendDataMessage(event: SseEvent) {
    sendAgentMessage(ws, {
      type: 'data',
      event,
    })
  }

  events.on('plugin:start', (plugin) => {
    sendDataMessage({
      type: 'plugin:start',
      data: [plugin],
      timestamp: Date.now(),
    })
  })

  events.on('plugin:end', (plugin, meta) => {
    sendDataMessage({
      type: 'plugin:end',
      data: [plugin, meta],
      timestamp: Date.now(),
    })
  })

  events.on('files:processing:start', (files) => {
    sendDataMessage({
      type: 'files:processing:start',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  events.on('file:processing:update', (meta) => {
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

  events.on('files:processing:end', (files) => {
    sendDataMessage({
      type: 'files:processing:end',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  events.on('info', (message, info) => {
    sendDataMessage({
      type: 'info',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('success', (message, info) => {
    sendDataMessage({
      type: 'success',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('warn', (message, info) => {
    sendDataMessage({
      type: 'warn',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('generation:start', (config) => {
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

  events.on('generation:end', (config, files, sources) => {
    const sourcesRecord: Record<string, string> = {}

    sources.forEach((value, key) => {
      sourcesRecord[key] = value
    })
    sendDataMessage({
      type: 'generation:end',
      data: [config, files, sourcesRecord],
      timestamp: Date.now(),
    })
  })

  events.on('error', (error) => {
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
