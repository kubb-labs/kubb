import { defineEventHandler, HTTPError } from 'h3'

import type { SseEvent, SseEvents, SseEventType } from '../../../src/types.ts'

export default defineEventHandler(async (event) => {
  const context = globalThis.__KUBB_AGENT_CONTEXT__ as any
  if (!context) {
    throw new HTTPError({ statusCode: 500, statusMessage: 'Server context not initialized' })
  }

  // Only accept POST requests
  if (event.req.method !== 'POST') {
    throw new HTTPError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  // Set SSE headers
  event.res.headers.set('Content-Type', 'text/event-stream')
  event.res.headers.set('Cache-Control', 'no-cache')
  event.res.headers.set('Connection', 'keep-alive')

  // Use streaming handler for SSE
  return new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      function send<T extends SseEventType>(type: T, ...data: SseEvents[T]) {
        const sseEvent: SseEvent = { type, data, timestamp: Date.now() }
        const message = `data: ${JSON.stringify(sseEvent)}\n\n`
        controller.enqueue(new TextEncoder().encode(message))
      }

      try {
        // Forward specific events to SSE stream with proper transformations
        context.events.on('plugin:start', (plugin: any) => send('plugin:start', plugin))
        context.events.on('plugin:end', (plugin: any, meta: any) => send('plugin:end', plugin, meta))

        // Transform files:processing events to match StreamEvents format
        context.events.on('files:processing:start', (files: any) => send('files:processing:start', { total: files.length }))
        context.events.on('file:processing:update', (meta: any) => {
          send('file:processing:update', {
            file: meta.file.path,
            processed: meta.processed,
            total: meta.total,
            percentage: meta.percentage,
          })
        })
        context.events.on('files:processing:end', (files: any) => send('files:processing:end', { total: files.length }))

        // Simple passthrough events
        context.events.on('info', (message: any, info: any) => send('info', message, info))
        context.events.on('success', (message: any, info: any) => send('success', message, info))
        context.events.on('warn', (message: any, info: any) => send('warn', message, info))

        // Transform generation events to match StreamEvents format
        context.events.on('generation:start', (config: any) => {
          send('generation:start', {
            name: config.name,
            plugins: config.plugins?.length || 0,
          })
        })
        context.events.on('generation:end', (config: any, files: any, sources: any) => {
          // Convert Map to Record for JSON serialization
          const sourcesRecord: Record<string, string> = {}
          sources.forEach((value: any, key: any) => {
            sourcesRecord[key] = value
          })
          send('generation:end', config, files, sourcesRecord)
        })

        // Special handling for error events
        context.events.on('error', (error: Error) => {
          send('error', {
            message: error.message,
            stack: error.stack,
          })
        })

        // Run generation
        await context.onGenerate()
      } catch (error) {
        const sseEvent: SseEvent = {
          type: 'error',
          data: [
            {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
            },
          ],
          timestamp: Date.now(),
        }
        const message = `data: ${JSON.stringify(sseEvent)}\n\n`
        controller.enqueue(new TextEncoder().encode(message))
      } finally {
        const endEvent: SseEvent = { type: 'lifecycle:end', data: [], timestamp: Date.now() }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(endEvent)}\n\n`))
        controller.close()
      }
    },
  })
})
