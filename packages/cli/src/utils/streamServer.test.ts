import { readFileSync } from 'node:fs'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { request } from 'node:http'
import { defineConfig } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStreamLogger } from '../loggers/streamLogger.ts'
import { generate } from '../runners/generate.ts'
import { startStreamServer } from './streamServer.ts'

// Mock dependencies
vi.mock('node:fs')
vi.mock('@clack/prompts', () => ({
  default: {
    log: {
      success: vi.fn(),
      info: vi.fn(),
      step: vi.fn(),
    },
  },
}))
vi.mock('../loggers/streamLogger.ts')
vi.mock('../runners/generate.ts')

describe('streamServer', () => {
  let server: Server | null = null
  let port: number
  const host = 'localhost'

  beforeEach(() => {
    // Find an available port for each test
    port = 3000 + Math.floor(Math.random() * 1000)
  })

  afterEach(async () => {
    // Clean up server
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve())
      })
      server = null
    }
    vi.clearAllMocks()
  })

  describe('startStreamServer', () => {
    it('should start server and respond to health check', async () => {
      const config = defineConfig({
        name: 'test-api',
        root: '.',
        input: { path: './openapi.yaml' },
        output: { path: './src/gen' },
        plugins: [],
      })

      // Start server but don't await (it runs indefinitely)
      const serverPromise = startStreamServer({
        port,
        host,
        configPath: 'kubb.config.ts',
        config,
        args: { logLevel: 'info', watch: false, debug: false },
      })

      // Give server time to start
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Make health check request
      const response = await new Promise<{ statusCode?: number; body: string }>((resolve, reject) => {
        const req = request(
          {
            hostname: host,
            port,
            path: '/health',
            method: 'GET',
          },
          (res: IncomingMessage) => {
            let body = ''
            res.on('data', (chunk) => {
              body += chunk
            })
            res.on('end', () => {
              resolve({ statusCode: res.statusCode, body })
            })
          },
        )
        req.on('error', reject)
        req.end()
      })

      expect(response.statusCode).toBe(200)
      const healthData = JSON.parse(response.body)
      expect(healthData).toEqual({
        status: 'ok',
        version: expect.any(String),
        configPath: expect.any(String),
      })
    })

    it('should respond to /api/info endpoint with config and spec', async () => {
      const mockSpecContent = 'openapi: 3.0.0\ninfo:\n  title: Test API'
      vi.mocked(readFileSync).mockReturnValue(mockSpecContent)

      const config = defineConfig({
        name: 'test-api',
        root: '.',
        input: { path: './openapi.yaml' },
        output: {
          path: './src/gen',
          write: true,
          extension: { '.ts': '.ts' },
          barrelType: 'all',
        },
        plugins: [],
      })

      await startStreamServer({
        port,
        host,
        configPath: 'kubb.config.ts',
        config,
        args: { logLevel: 'info', watch: false, debug: false },
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const response = await new Promise<{ statusCode?: number; body: string }>((resolve, reject) => {
        const req = request(
          {
            hostname: host,
            port,
            path: '/api/info',
            method: 'GET',
          },
          (res: IncomingMessage) => {
            let body = ''
            res.on('data', (chunk) => {
              body += chunk
            })
            res.on('end', () => {
              resolve({ statusCode: res.statusCode, body })
            })
          },
        )
        req.on('error', reject)
        req.end()
      })

      expect(response.statusCode).toBe(200)
      const connectData = JSON.parse(response.body)
      expect(connectData).toEqual({
        version: expect.any(String),
        configPath: expect.any(String),
        spec: mockSpecContent,
        config: {
          name: 'test-api',
          root: '.',
          input: {
            path: './openapi.yaml',
          },
          output: {
            path: './src/gen',
            write: true,
            extension: { '.ts': '.ts' },
            barrelType: 'all',
          },
          plugins: [],
        },
      })
    })

    it('should stream events via /api/stream endpoint', async () => {
      const config = defineConfig({
        name: 'test-api',
        root: '.',
        input: { path: './openapi.yaml' },
        output: { path: './src/gen' },
        plugins: [],
      })

      // Mock stream logger
      const mockStreamLogger = {
        install: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(createStreamLogger).mockReturnValue(mockStreamLogger as any)

      // Mock generate to emit some events
      vi.mocked(generate).mockImplementation(async ({ events }) => {
        if (events) {
          await events.emit('generation:start', config)
          await events.emit('plugin:start', { name: 'plugin-ts' } as any)
          await events.emit('plugin:end', { name: 'plugin-ts' } as any, { duration: 100, success: true })
          await events.emit('generation:end', config, [], new Map())
        }
      })

      await startStreamServer({
        port,
        host,
        configPath: 'kubb.config.ts',
        config,
        args: { logLevel: 'info', watch: false, debug: false },
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const events: string[] = []

      await new Promise<void>((resolve, reject) => {
        const req = request(
          {
            hostname: host,
            port,
            path: '/api/stream',
            method: 'POST',
            headers: {
              Accept: 'text/event-stream',
            },
          },
          (res: IncomingMessage) => {
            expect(res.statusCode).toBe(200)
            expect(res.headers['content-type']).toBe('text/event-stream')
            expect(res.headers['cache-control']).toBe('no-cache')
            expect(res.headers.connection).toBe('keep-alive')

            let buffer = ''
            res.on('data', (chunk) => {
              buffer += chunk.toString()
              // Split by double newline (SSE event separator)
              const parts = buffer.split('\n\n')
              buffer = parts.pop() || ''

              for (const part of parts) {
                if (part.startsWith('data: ')) {
                  events.push(part.substring(6))
                }
              }
            })

            res.on('end', () => {
              resolve()
            })
          },
        )
        req.on('error', reject)
        req.end()
      })

      // Verify that we received the lifecycle:end event
      expect(events.length).toBeGreaterThan(0)
      const lastEvent = JSON.parse(events[events.length - 1])
      expect(lastEvent.type).toBe('lifecycle:end')

      // Verify generate was called
      expect(generate).toHaveBeenCalledWith({
        input: undefined,
        config,
        logLevel: 3,
        events: expect.any(AsyncEventEmitter),
      })

      // Verify stream logger was created and installed
      expect(createStreamLogger).toHaveBeenCalledWith(expect.any(Object))
      expect(mockStreamLogger.install).toHaveBeenCalled()
    })

    it('should handle 404 for unknown routes', async () => {
      const config = defineConfig({
        name: 'test-api',
        root: '.',
        input: { path: './openapi.yaml' },
        output: { path: './src/gen' },
        plugins: [],
      })

      await startStreamServer({
        port,
        host,
        configPath: 'kubb.config.ts',
        config,
        args: { logLevel: 'info', watch: false, debug: false },
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const response = await new Promise<{ statusCode?: number; body: string }>((resolve, reject) => {
        const req = request(
          {
            hostname: host,
            port,
            path: '/unknown',
            method: 'GET',
          },
          (res: IncomingMessage) => {
            let body = ''
            res.on('data', (chunk) => {
              body += chunk
            })
            res.on('end', () => {
              resolve({ statusCode: res.statusCode, body })
            })
          },
        )
        req.on('error', reject)
        req.end()
      })

      expect(response.statusCode).toBe(404)
      const errorData = JSON.parse(response.body)
      expect(errorData).toEqual({ error: 'Not found' })
    })

    it('should handle CORS preflight requests', async () => {
      const config = defineConfig({
        name: 'test-api',
        root: '.',
        input: { path: './openapi.yaml' },
        output: { path: './src/gen' },
        plugins: [],
      })

      await startStreamServer({
        port,
        host,
        configPath: 'kubb.config.ts',
        config,
        args: { logLevel: 'info', watch: false, debug: false },
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const response = await new Promise<{ statusCode?: number; headers: any }>((resolve, reject) => {
        const req = request(
          {
            hostname: host,
            port,
            path: '/api/stream',
            method: 'OPTIONS',
          },
          (res: IncomingMessage) => {
            resolve({ statusCode: res.statusCode, headers: res.headers })
          },
        )
        req.on('error', reject)
        req.end()
      })

      expect(response.statusCode).toBe(204)
      expect(response.headers['access-control-allow-origin']).toBe('*')
      expect(response.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS')
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type')
    })

    it('should send error event when generation fails', async () => {
      const config = defineConfig({
        name: 'test-api',
        root: '.',
        input: { path: './openapi.yaml' },
        output: { path: './src/gen' },
        plugins: [],
      })

      const mockStreamLogger = {
        install: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(createStreamLogger).mockReturnValue(mockStreamLogger as any)

      const testError = new Error('Generation failed')
      vi.mocked(generate).mockRejectedValue(testError)

      await startStreamServer({
        port,
        host,
        configPath: 'kubb.config.ts',
        config,
        args: { logLevel: 'info', watch: false, debug: false },
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const events: string[] = []

      await new Promise<void>((resolve, reject) => {
        const req = request(
          {
            hostname: host,
            port,
            path: '/api/stream',
            method: 'POST',
          },
          (res: IncomingMessage) => {
            let buffer = ''
            res.on('data', (chunk) => {
              buffer += chunk.toString()
              const parts = buffer.split('\n\n')
              buffer = parts.pop() || ''

              for (const part of parts) {
                if (part.startsWith('data: ')) {
                  events.push(part.substring(6))
                }
              }
            })

            res.on('end', () => {
              resolve()
            })
          },
        )
        req.on('error', reject)
        req.end()
      })

      // Find error event
      const errorEvent = events.find((e) => {
        const parsed = JSON.parse(e)
        return parsed.type === 'error'
      })

      expect(errorEvent).toBeDefined()
      const parsedError = JSON.parse(errorEvent!)
      expect(parsedError.type).toBe('error')
      expect(parsedError.data[0].message).toBe('Generation failed')
    })
  })
})
