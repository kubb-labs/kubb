import type { KubbEvents, Plugin } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentMessage } from '~/types/agent.ts'
import { createWebsocket, sendAgentMessage, setupEventsStream } from './ws.ts'

describe('WebSocket utilities', () => {
  let mockWs: any
  let _originalWebSocket: any

  beforeEach(() => {
    _originalWebSocket = global.WebSocket
  })

  describe('createWebsocket', () => {
    it('should resolve with WebSocket on successful connection', async () => {
      mockWs = {
        readyState: 0,
        addEventListener: vi.fn((event: string, handler: Function) => {
          if (event === 'open') {
            setTimeout(() => {
              handler()
            }, 0)
          }
        }),
        removeEventListener: vi.fn(),
      }

      global.WebSocket = class {
        constructor() {
          return mockWs
        }
      } as any

      const ws = await createWebsocket('ws://localhost:8000', {})
      expect(ws).toBe(mockWs)
    })

    it('should timeout after 5 seconds if connection not established', async () => {
      mockWs = {
        readyState: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
      }

      global.WebSocket = class {
        constructor() {
          return mockWs
        }
      } as any

      vi.useFakeTimers()
      const promise = createWebsocket('ws://localhost:8000', {})
      vi.advanceTimersByTime(5100)
      const result = await promise

      expect(result).toBeNull()
      expect(mockWs.close).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should pass auth headers to WebSocket constructor', () => {
      mockWs = {
        readyState: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const constructorSpy = vi.fn(function () {
        return mockWs
      })

      global.WebSocket = constructorSpy as any

      const options = { headers: { Authorization: 'Bearer token123' } }
      createWebsocket('ws://localhost:8000', options)

      expect(constructorSpy).toHaveBeenCalledWith('ws://localhost:8000', options)
    })
  })

  describe('sendAgentMessage', () => {
    it('should send message when WebSocket is open', () => {
      mockWs = {
        readyState: 1, // OPEN
        send: vi.fn(),
      }

      const message = { type: 'ping' as const }
      sendAgentMessage(mockWs, message)

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should not send when WebSocket is not open', () => {
      mockWs = {
        readyState: 0, // CONNECTING
        send: vi.fn(),
      }

      const message = { type: 'ping' as const }
      sendAgentMessage(mockWs, message)

      expect(mockWs.send).not.toHaveBeenCalled()
    })

    it('should handle send errors gracefully', () => {
      mockWs = {
        readyState: 1,
        send: vi.fn(() => {
          throw new Error('Send failed')
        }),
      }

      const message = { type: 'ping' as const }
      expect(() => sendAgentMessage(mockWs, message)).not.toThrow()
    })

    it('should serialize complex agent messages', () => {
      mockWs = {
        readyState: 1,
        send: vi.fn(),
      }

      const message = {
        type: 'connected' as const,
        payload: {
          version: '4.24.0',
          configPath: 'kubb.config.ts',
          spec: 'openapi: 3.0.0',
          config: {
            name: 'api',
            root: './src',
            input: { path: 'spec.yaml' },
            output: { path: './dist', write: true, extension: '.ts', barrelType: 'star' as const },
            plugins: [{ name: '@kubb/plugin-ts', options: {} }],
          },
        },
      } as unknown as AgentMessage

      sendAgentMessage(mockWs, message)

      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('4.24.0'))
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('plugin-ts'))
    })
  })

  describe('setupEventsStream', () => {
    let mockWs: any
    let events: AsyncEventEmitter<KubbEvents>

    beforeEach(() => {
      mockWs = {
        readyState: 1,
        send: vi.fn(),
      }
      events = new AsyncEventEmitter<KubbEvents>()
    })

    it('should forward plugin events to WebSocket', async () => {
      setupEventsStream(mockWs, events)

      await events.emit('plugin:start', { name: 'test-plugin' } as Plugin)

      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('"plugin:start"'))
    })

    it('should forward generation events with sources map', async () => {
      setupEventsStream(mockWs, events)

      const config = { name: 'test', plugins: [{ name: 'plugin1' }] }
      const files = [{ path: 'file1.ts' }, { path: 'file2.ts' }]
      const sources = new Map([
        ['key1', 'export type User = { id: string }'],
        ['key2', 'export const api = new Client()'],
      ])

      await events.emit('generation:end', config as any, files as any, sources)

      const call = mockWs.send.mock.calls[0][0]
      expect(call).toContain('"generation:end"')
      expect(call).toContain('"key1"')
      expect(call).toContain('export type User')
    })

    it('should forward file processing updates with progress metrics', async () => {
      setupEventsStream(mockWs, events)

      const meta = {
        file: { path: 'schema.ts' },
        processed: 5,
        total: 10,
        percentage: 50,
      }

      await events.emit('file:processing:update', meta as any)

      const call = mockWs.send.mock.calls[0][0]
      expect(call).toContain('"schema.ts"')
      expect(call).toContain('"processed":5')
      expect(call).toContain('"percentage":50')
    })

    it('should include timestamp in all forwarded events', async () => {
      setupEventsStream(mockWs, events)

      const before = Date.now()
      await events.emit('info', 'test message')
      const after = Date.now()

      const call = mockWs.send.mock.calls[0][0]
      const parsed = JSON.parse(call)

      expect(parsed.event.timestamp).toBeGreaterThanOrEqual(before)
      expect(parsed.event.timestamp).toBeLessThanOrEqual(after)
    })

    it('should forward error events with error details', async () => {
      setupEventsStream(mockWs, events)

      const error = new Error('Plugin compilation failed')
      error.stack = 'Error: Plugin compilation failed\n  at compile.ts:42:10'

      await events.emit('error', error)

      const call = mockWs.send.mock.calls[0][0]
      expect(call).toContain('Plugin compilation failed')
      expect(call).toContain('compile.ts')
    })

    it('should forward success and warning events', async () => {
      setupEventsStream(mockWs, events)

      await events.emit('success', 'Generation completed successfully')
      expect(mockWs.send.mock.calls[0][0]).toContain('"success"')

      mockWs.send.mockClear()

      await events.emit('warn', 'Deprecated feature used')
      expect(mockWs.send.mock.calls[0][0]).toContain('"warn"')
    })

    it('should forward file processing lifecycle events', async () => {
      setupEventsStream(mockWs, events)

      const files = [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }]

      await events.emit('files:processing:start', files as any)
      expect(mockWs.send.mock.calls[0][0]).toContain('"files:processing:start"')
      expect(mockWs.send.mock.calls[0][0]).toContain('"total":3')

      mockWs.send.mockClear()

      await events.emit('files:processing:end', files as any)
      expect(mockWs.send.mock.calls[0][0]).toContain('"files:processing:end"')
    })
  })
})
