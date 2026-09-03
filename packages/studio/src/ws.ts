import { getElapsedMs, inParallel } from '@internals/utils'
import { Diagnostics, type Hookable } from '@kubb/core'
import WebSocket from 'ws'
import type { AgentMessage, DataMessagePayload } from './protocol/index.ts'
import type { AgentHooks } from './hooks.ts'

type WebSocketOptions = WebSocket.ClientOptions

/**
 * How many generated files are read from storage at once when building the
 * `kubb:generation:end` payload. A spec producing thousands of files would otherwise fire one
 * `storage.readItem` per file simultaneously.
 */
const FILE_READ_CONCURRENCY = 50

/**
 * How long the initial handshake may take before the socket is closed and the reconnect loop
 * takes over.
 */
const CONNECT_TIMEOUT_MS = 5_000

/**
 * Per-socket event counter. Every data message carries the next value so Studio can restore the
 * agent's emission order even when the relay delivers frames out of order. Keyed by the socket so
 * the count stays monotonic across every generation run on one connection, and is dropped
 * automatically once the socket is collected.
 */
const eventSeqCounters = new WeakMap<WebSocket, number>()

function nextEventSeq(ws: WebSocket): number {
  const seq = eventSeqCounters.get(ws) ?? 0
  eventSeqCounters.set(ws, seq + 1)

  return seq
}

/**
 * Opens a Studio WebSocket connection and closes it when the initial handshake exceeds the configured timeout.
 */
export function createWebsocket(url: string, options: WebSocketOptions): WebSocket {
  const ws = new WebSocket(url, options)

  const timer = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close(3008, 'Connection timeout')
    }
  }, CONNECT_TIMEOUT_MS)

  // Once the handshake settles the timer has nothing left to check, and leaving it pending holds
  // the socket for the rest of the window.
  ws.once('open', () => clearTimeout(timer))
  ws.once('close', () => clearTimeout(timer))

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
  } catch (error) {
    throw new Error('Failed to send message to Kubb Studio', { cause: error })
  }
}

/**
 * Sends a single `kubb:error` to Studio, stamped from the same per-socket counter the event stream
 * uses so Studio can still order it against the generation events around it.
 */
export function sendErrorMessage(ws: WebSocket, error: Error): void {
  sendAgentMessage(ws, {
    type: 'kubb:data',
    payload: { type: 'kubb:error', data: [{ message: error.message, stack: error.stack }], timestamp: Date.now(), seq: nextEventSeq(ws) },
  })
}

/**
 * Forwards selected Kubb lifecycle events to Studio as data messages for the active session.
 */
export function setupEventsStream(ws: WebSocket, hooks: Hookable<AgentHooks>): void {
  function sendDataMessage(payload: Omit<DataMessagePayload, 'seq' | 'timestamp'>) {
    sendAgentMessage(ws, {
      type: 'kubb:data',
      payload: { ...payload, timestamp: Date.now(), seq: nextEventSeq(ws) },
    })
  }

  hooks.hook('kubb:plugin:start', (ctx) => {
    sendDataMessage({
      type: 'kubb:plugin:start',
      data: [{ plugin: ctx.plugin }],
    })
  })

  hooks.hook('kubb:plugin:end', (ctx) => {
    sendDataMessage({
      type: 'kubb:plugin:end',
      data: [{ plugin: ctx.plugin, duration: ctx.duration, success: ctx.success }],
    })
  })

  hooks.hook('kubb:build:start', ({ config, adapter }) => {
    sendDataMessage({
      type: 'kubb:build:start',
      data: [{ config: { name: config.name }, adapter: { name: adapter.name } }],
    })
  })

  hooks.hook('kubb:build:end', ({ files, outputDir }) => {
    sendDataMessage({
      type: 'kubb:build:end',
      data: [{ files: files.map((file) => ({ path: file.path, name: file.name })), outputDir }],
    })
  })

  hooks.hook('kubb:files:processing:start', ({ files }) => {
    sendDataMessage({
      type: 'kubb:files:processing:start',
      data: [{ total: files.length }],
    })
  })

  hooks.hook('kubb:files:processing:update', ({ files }) => {
    sendDataMessage({
      type: 'kubb:files:processing:update',
      data: [
        {
          files: files.map(({ file, processed, total, percentage }) => ({
            file: file.path,
            processed,
            total,
            percentage,
          })),
        },
      ],
    })
  })

  hooks.hook('kubb:files:processing:end', ({ files }) => {
    sendDataMessage({
      type: 'kubb:files:processing:end',
      data: [{ total: files.length }],
    })
  })

  // The three log levels differ only in their event name.
  for (const type of ['kubb:info', 'kubb:success', 'kubb:warn'] as const) {
    hooks.hook(type, ({ message, info }) => {
      sendDataMessage({ type, data: [{ message, info }] })
    })
  }

  hooks.hook('kubb:generation:start', ({ config }) => {
    sendDataMessage({
      type: 'kubb:generation:start',
      data: [
        {
          name: config.name,
          plugins: config.plugins.length,
        },
      ],
    })
  })

  hooks.hook('kubb:generation:end', async ({ config, storage, diagnostics = [], status, hrStart, filesCreated }) => {
    const paths = await storage.readKeys()
    const files: Record<string, string> = {}
    await inParallel({
      items: paths,
      limit: FILE_READ_CONCURRENCY,
      run: async (path) => {
        const content = await storage.readItem(path)
        if (content !== null) files[path] = content
      },
    })

    sendDataMessage({
      type: 'kubb:generation:end',
      data: [{ config, storage: files }],
    })

    if (!hrStart) {
      return
    }

    const duration = Math.round(getElapsedMs(hrStart))

    sendDataMessage({
      type: 'kubb:generation:summary',
      data: [{ duration, fileCount: filesCreated ?? 0, failedPlugins: Diagnostics.failedPlugins(diagnostics).length, status: status ?? 'success' }],
    })
  })

  hooks.hook('kubb:error', ({ error }) => {
    sendDataMessage({
      type: 'kubb:error',
      data: [
        {
          message: error.message,
          stack: error.stack,
        },
      ],
    })
  })

  // Bracketing events carry no context, so they forward identically.
  for (const type of [
    'kubb:lifecycle:start',
    'kubb:lifecycle:end',
    'kubb:format:start',
    'kubb:format:end',
    'kubb:lint:start',
    'kubb:lint:end',
    'kubb:hooks:start',
    'kubb:hooks:end',
  ] as const) {
    hooks.hook(type, () => {
      sendDataMessage({ type, data: [] })
    })
  }

  hooks.hook('kubb:hook:start', ({ id, command, args }) => {
    sendDataMessage({
      type: 'kubb:hook:start',
      data: [{ id, command, args: args ? [...args] : undefined }],
    })
  })

  hooks.hook('kubb:hook:line', ({ id, line }) => {
    sendDataMessage({
      type: 'kubb:hook:line',
      data: [{ id, line }],
    })
  })

  hooks.hook('kubb:hook:end', ({ id, command, args, success, error }) => {
    sendDataMessage({
      type: 'kubb:hook:end',
      data: [
        {
          id,
          command,
          args: args ? [...args] : undefined,
          success,
          error: error ? { message: error.message, stack: error.stack } : undefined,
        },
      ],
    })
  })
}
