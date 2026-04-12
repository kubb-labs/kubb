import type { FileNode } from '@kubb/ast/types'
import type { AsyncEventEmitter, KubbEvents } from '@kubb/core'
import WebSocket from 'ws'
import type { AgentMessage, DataMessagePayload } from '~/types/agent.ts'

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
export function setupEventsStream(ws: WebSocket, events: AsyncEventEmitter<KubbEvents>, getSource?: () => 'generate' | 'publish' | undefined): void {
  function sendDataMessage(payload: DataMessagePayload) {
    sendAgentMessage(ws, {
      type: 'data',
      payload: { ...payload, source: getSource?.() },
    })
  }

  events.on('kubb:plugin:start', (plugin) => {
    sendDataMessage({
      type: 'kubb:plugin:start',
      data: [plugin],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:plugin:end', (plugin, meta) => {
    sendDataMessage({
      type: 'kubb:plugin:end',
      data: [plugin, meta],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:files:processing:start', (files) => {
    sendDataMessage({
      type: 'kubb:files:processing:start',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:file:processing:update', (meta) => {
    sendDataMessage({
      type: 'kubb:file:processing:update',
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

  events.on('kubb:files:processing:end', (files) => {
    sendDataMessage({
      type: 'kubb:files:processing:end',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:info', (message, info) => {
    sendDataMessage({
      type: 'kubb:info',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:success', (message, info) => {
    sendDataMessage({
      type: 'kubb:success',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:warn', (message, info) => {
    sendDataMessage({
      type: 'kubb:warn',
      data: [message, info],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:generation:start', (config) => {
    sendDataMessage({
      type: 'kubb:generation:start',
      data: [
        {
          name: config.name,
          plugins: config.plugins.length,
        },
      ],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:generation:end', (config, files, sources) => {
    const sourcesRecord: Record<string, string> = {}

    sources.forEach((value, key) => {
      sourcesRecord[key] = value
    })
    sendDataMessage({
      type: 'kubb:generation:end',
      data: [config, files as unknown as FileNode[], sourcesRecord],
      timestamp: Date.now(),
    })
  })

  events.on('kubb:error', (error) => {
    sendDataMessage({
      type: 'kubb:error',
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
