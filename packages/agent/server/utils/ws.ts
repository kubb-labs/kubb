import type { KubbEvents, SseEvent } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import type { AgentMessage } from '~/types/agent.ts'

const WEBSOCKET_READY = 1
const WEBSOCKET_CONNECTING = 0

/**
 * Open a WebSocket connection to the given URL and resolve once the connection is established.
 * Rejects on error or resolves with `null` when the connection cannot be established within 5 seconds.
 *
 */
export function createWebsocket(url: string, options: Record<string, any>): WebSocket {
  const ws = new WebSocket(url, options)

  // Timeout after 5 seconds
  setTimeout(() => {
    if (ws.readyState === WEBSOCKET_CONNECTING) {
      ws.close(3008, 'Connection timeout')
    }
  }, 5000)

  return ws
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
    throw new Error('Failed to send message to Kubb Studio', { cause: error })
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
