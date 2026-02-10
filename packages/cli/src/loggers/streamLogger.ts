import type { ServerResponse } from 'node:http'
import { relative } from 'node:path'
import type { StreamEvent, StreamEvents, StreamEventType } from '@kubb/core'
import { defineLogger, LogLevel } from '@kubb/core'

type StreamLoggerState = {
  res: ServerResponse
}

/**
 * Stream logger for SSE (Server-Sent Events) streaming
 * Sends Kubb events to HTTP client via SSE protocol
 */
export function createStreamLogger(res: ServerResponse) {
  return defineLogger({
    name: 'stream',
    install(context, options) {
      const logLevel = options?.logLevel || LogLevel.info
      const state: StreamLoggerState = { res }

      // Helper to send SSE events
      function send<T extends StreamEventType>(type: T, ...data: StreamEvents[T]) {
        const streamEvent: StreamEvent = { type, data }

        if (!state.res.destroyed) {
          state.res.write(`data: ${JSON.stringify(streamEvent)}\n\n`)
        }
      }

      // Plugin events
      context.on('plugin:start', (plugin) => {
        send('plugin:start', { name: plugin.name })
      })

      context.on('plugin:end', (plugin, { duration, success }) => {
        send('plugin:end', { name: plugin.name }, { duration, success })
      })

      // File processing events
      context.on('files:processing:start', (files) => {
        send('files:processing:start', { total: files.length })
      })

      context.on('file:processing:update', ({ file, processed, total, percentage, config }) => {
        send('file:processing:update', {
          file: file.path ? relative(config.root, file.path) : file.baseName || 'unknown',
          processed,
          total,
          percentage,
        })
      })

      context.on('files:processing:end', (files) => {
        send('files:processing:end', { total: files.length })
      })

      // Info/Success events
      context.on('info', (message, info) => {
        if (logLevel <= LogLevel.silent) return
        send('info', message, info)
      })

      context.on('success', (message, info) => {
        if (logLevel <= LogLevel.silent) return
        send('success', message, info)
      })

      // Warning events
      context.on('warn', (message, info) => {
        if (logLevel < LogLevel.warn) return
        send('warn', message, info)
      })

      // Error events
      context.on('error', (error) => {
        send('error', {
          message: error.message,
          stack: logLevel >= LogLevel.debug ? error.stack : undefined,
        })
      })

      // Generation lifecycle
      context.on('generation:start', (config) => {
        send('generation:start', {
          name: config.name,
          plugins: config.plugins?.length || 0,
        })
      })

      context.on('generation:end', (config, files, sources) => {
        send('generation:end', config, files, Object.fromEntries(sources))
      })
    },
  })
}
