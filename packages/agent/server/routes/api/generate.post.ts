import type { SseEvent, SseEvents, SseEventType } from '@kubb/core'
import { defineEventHandler } from 'h3'
import { useKubbAgentContext } from '~/utils/useKubbAgentContext.ts'

export default defineEventHandler(async (event) => {
  const { events, onGenerate } = useKubbAgentContext()

  event.res.headers.set('Content-Type', 'text/event-stream')
  event.res.headers.set('Cache-Control', 'no-cache')
  event.res.headers.set('Connection', 'keep-alive')

  // Create a ReadableStream to stream SSE events
  const stream = new ReadableStream<string>({
    start(controller) {
      const queue: string[] = []
      let draining = false

      // Helper to send SSE events
      function send<T extends SseEventType>(type: T, ...data: SseEvents[T]) {
        const sseEvent: SseEvent = { type, data, timestamp: Date.now() }
        const message = `data: ${JSON.stringify(sseEvent)}\n\n`
        queue.push(message)
        drain()
      }

      async function drain() {
        if (draining) return
        draining = true

        while (queue.length > 0) {
          const message = queue.shift()
          if (message) {
            controller.enqueue(message)
          }
        }

        draining = false
      }

      // Forward specific events to SSE stream
      events.on('plugin:start', (plugin: any) => send('plugin:start', plugin))
      events.on('plugin:end', (plugin: any, meta: any) => send('plugin:end', plugin, meta))

      // Transform files:processing events
      events.on('files:processing:start', (files: any) => send('files:processing:start', { total: files.length }))
      events.on('file:processing:update', (meta: any) => {
        send('file:processing:update', {
          file: meta.file.path,
          processed: meta.processed,
          total: meta.total,
          percentage: meta.percentage,
        })
      })
      events.on('files:processing:end', (files: any) => send('files:processing:end', { total: files.length }))

      // Simple passthrough events
      events.on('info', (message: any, info: any) => send('info', message, info))
      events.on('success', (message: any, info: any) => send('success', message, info))
      events.on('warn', (message: any, info: any) => send('warn', message, info))

      // Transform generation events
      events.on('generation:start', (config: any) => {
        send('generation:start', {
          name: config.name,
          plugins: config.plugins?.length || 0,
        })
      })
      events.on('generation:end', (config: any, files: any, sources: any) => {
        const sourcesRecord: Record<string, string> = {}
        sources.forEach((value: any, key: any) => {
          sourcesRecord[key] = value
        })
        send('generation:end', config, files, sourcesRecord)
      })

      // Error events
      events.on('error', (error: Error) => {
        send('error', {
          message: error.message,
          stack: error.stack,
        })
      })

      // Run generation and handle completion
      onGenerate()
        .catch((error) => {
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
          queue.push(`data: ${JSON.stringify(sseEvent)}\n\n`)
        })
        .finally(() => {
          const endEvent: SseEvent = { type: 'lifecycle:end', data: [], timestamp: Date.now() }
          queue.push(`data: ${JSON.stringify(endEvent)}\n\n`)
          drain().then(() => {
            controller.close()
          })
        })
    },
  })

  return stream
})
