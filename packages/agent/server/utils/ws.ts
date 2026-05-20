import type { AsyncEventEmitter, KubbHooks } from '@kubb/core'
import WebSocket from 'ws'
import type { AgentMessage, DataMessagePayload } from '~/types/agent.ts'
import { websocketDefaults } from '../constants.ts'

type WebSocketOptions = WebSocket.ClientOptions

/**
 * Opens a Studio WebSocket connection and closes it when the initial handshake exceeds the configured timeout.
 */
export function createWebsocket(url: string, options: WebSocketOptions, timeoutMs = websocketDefaults.connectTimeoutMs): WebSocket {
  const ws = new WebSocket(url, options)

  setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close(websocketDefaults.closeCode.timeout, websocketDefaults.closeReason.timeout)
    }
  }, timeoutMs)

  return ws
}

/**
 * Sends a serialized agent message when the Studio socket is ready to accept frames.
 */
export function sendAgentMessage(ws: WebSocket, message: AgentMessage): void {
  try {
    if (ws.readyState !== WebSocket.OPEN) {
      return
    }

    ws.send(JSON.stringify(message))
  } catch (error: any) {
    throw new Error('Failed to send message to Kubb Studio', { cause: error })
  }
}

/**
 * Forwards selected Kubb lifecycle events to Studio as data messages for the active session.
 */
export function setupEventsStream(ws: WebSocket, hooks: AsyncEventEmitter<KubbHooks>): void {
  function sendDataMessage(payload: DataMessagePayload) {
    sendAgentMessage(ws, {
      type: 'data',
      payload,
    })
  }

  hooks.on('kubb:plugin:start', (ctx) => {
    sendDataMessage({
      type: 'kubb:plugin:start',
      data: [{ plugin: ctx.plugin }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:plugin:end', (ctx) => {
    sendDataMessage({
      type: 'kubb:plugin:end',
      data: [{ plugin: ctx.plugin, duration: ctx.duration, success: ctx.success }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:build:start', ({ config, adapter }) => {
    sendDataMessage({
      type: 'kubb:build:start',
      data: [{ config: { name: config.name }, adapter: { name: adapter.name } }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:build:end', ({ files, outputDir }) => {
    sendDataMessage({
      type: 'kubb:build:end',
      data: [{ files: files.map((file) => ({ path: file.path, name: file.name })), outputDir }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:files:processing:start', ({ files }) => {
    sendDataMessage({
      type: 'kubb:files:processing:start',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:files:processing:update', ({ files }) => {
    sendDataMessage({
      type: 'kubb:files:processing:update',
      data: [
        {
          files: files.map((ctx) => ({
            file: ctx.file.path,
            processed: ctx.processed,
            total: ctx.total,
            percentage: ctx.percentage,
          })),
        },
      ],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:files:processing:end', ({ files }) => {
    sendDataMessage({
      type: 'kubb:files:processing:end',
      data: [{ total: files.length }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:info', ({ message, info }) => {
    sendDataMessage({
      type: 'kubb:info',
      data: [{ message, info }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:success', ({ message, info }) => {
    sendDataMessage({
      type: 'kubb:success',
      data: [{ message, info }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:warn', ({ message, info }) => {
    sendDataMessage({
      type: 'kubb:warn',
      data: [{ message, info }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:generation:start', ({ config }) => {
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

  hooks.on('kubb:generation:end', async ({ config, storage }) => {
    const sourcesRecord: Record<string, string> = {}

    for (const key of await storage.getKeys()) {
      const value = await storage.getItem(key)
      if (value !== null) {
        sourcesRecord[key] = value
      }
    }
    sendDataMessage({
      type: 'kubb:generation:end',
      data: [{ config, storage: sourcesRecord }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:error', ({ error }) => {
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

  hooks.on('kubb:generation:summary', ({ failedPlugins, status, hrStart, filesCreated }) => {
    const [seconds, nanoseconds] = process.hrtime(hrStart)
    const duration = Math.round(seconds * 1000 + nanoseconds / 1_000_000)

    sendDataMessage({
      type: 'kubb:generation:summary',
      data: [{ duration, fileCount: filesCreated, failedPlugins: failedPlugins.size, status }],
      timestamp: Date.now(),
    })
  })

  hooks.on('kubb:lifecycle:start', () => {
    sendDataMessage({ type: 'kubb:lifecycle:start', data: [], timestamp: Date.now() })
  })

  hooks.on('kubb:lifecycle:end', () => {
    sendDataMessage({ type: 'kubb:lifecycle:end', data: [], timestamp: Date.now() })
  })

  hooks.on('kubb:format:start', () => {
    sendDataMessage({ type: 'kubb:format:start', data: [], timestamp: Date.now() })
  })

  hooks.on('kubb:format:end', () => {
    sendDataMessage({ type: 'kubb:format:end', data: [], timestamp: Date.now() })
  })

  hooks.on('kubb:lint:start', () => {
    sendDataMessage({ type: 'kubb:lint:start', data: [], timestamp: Date.now() })
  })

  hooks.on('kubb:lint:end', () => {
    sendDataMessage({ type: 'kubb:lint:end', data: [], timestamp: Date.now() })
  })
}
