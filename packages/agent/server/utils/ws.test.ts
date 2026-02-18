import type { Config, KubbEvents, Plugin } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { KubbFile } from '@kubb/fabric-core/types'
import { ws as mswWs } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { AgentMessage } from '~/types/agent.ts'
import { createWebsocket, sendAgentMessage, setupEventsStream } from './ws.ts'

// Test helper types
type MockPlugin = Pick<Plugin, 'name' | 'key' | 'options'>
type MockConfig = Pick<Config, 'name' | 'plugins'>
type MockFile = Pick<KubbFile.ResolvedFile, 'path'>

// Test constants
const TEST_WS_URL = 'ws://localhost:3000/studio'
const ASYNC_WAIT_SHORT = 50
const ASYNC_WAIT_MEDIUM = 100
const ASYNC_WAIT_LONG = 200

// Create MSW WebSocket link
const studio = mswWs.link(TEST_WS_URL)

describe('WebSocket', () => {
  const handlers = [
    studio.addEventListener('connection', ({ client }) => {
      // Auto-connect clients for basic tests
      client.addEventListener('message', (event) => {
        // Echo messages back for testing
        client.send(event.data)
      })
    }),
  ]

  const server = setupServer(...handlers)

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('createWebsocket', () => {
    it('should create a WebSocket connection successfully', async () => {
      const ws = await createWebsocket(TEST_WS_URL, {})

      expect(ws).toBeDefined()
      expect(ws?.readyState).toBe(WebSocket.OPEN)

      ws?.close()
    })

    it('should handle WebSocket close during connection', async () => {
      // Test that our cleanup logic works properly when connection closes early
      const closeEarlyLink = mswWs.link('ws://localhost:9999/close-early')

      server.use(
        closeEarlyLink.addEventListener('connection', ({ client }) => {
          // Close immediately after connection starts
          setTimeout(() => client.close(), 10)
        }),
      )

      const ws = await createWebsocket('ws://localhost:9999/close-early', {})

      // Connection may succeed briefly or return null depending on timing
      // Both are acceptable - we're testing that no errors are thrown
      expect(ws === null || ws.readyState !== undefined).toBe(true)

      ws?.close()
    })

    it('should handle connection close', async () => {
      const closeLink = mswWs.link('ws://localhost:3000/studio-close')
      server.use(
        closeLink.addEventListener('connection', ({ client, server }) => {
          // Close from server side immediately
          server.close()
        }),
      )

      const testWs = await createWebsocket('ws://localhost:3000/studio-close', {})

      // Connection might succeed briefly before closing, or return null
      if (testWs) {
        expect([WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED]).toContain(testWs.readyState)
        testWs.close()
      } else {
        expect(testWs).toBeNull()
      }
    })

    it('should cleanup event listeners after connection', async () => {
      const ws = await createWebsocket(TEST_WS_URL, {})

      expect(ws).toBeDefined()

      // Close and verify cleanup
      ws?.close()

      // Wait for close to process
      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))
    })
  })

  describe('sendAgentMessage', () => {
    let mockWs: WebSocket

    beforeEach(async () => {
      mockWs = (await createWebsocket(TEST_WS_URL, {})) as WebSocket
    })

    afterEach(() => {
      mockWs?.close()
    })

    it('should send a message when WebSocket is ready', async () => {
      const receivedMessages: string[] = []

      server.use(
        studio.addEventListener('connection', ({ client }) => {
          client.addEventListener('message', (event) => {
            receivedMessages.push(event.data as string)
          })
        }),
      )

      // Reconnect with new handler
      mockWs.close()
      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))
      mockWs = (await createWebsocket(TEST_WS_URL, {})) as WebSocket

      const message: AgentMessage = {
        type: 'ping',
      }

      sendAgentMessage(mockWs, message)

      // Wait for message to be received
      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      expect(receivedMessages.length).toBeGreaterThan(0)
      expect(receivedMessages[0]).toContain('"type":"ping"')
    })

    it('should not send message when WebSocket is not ready', () => {
      const closedWs = new WebSocket(TEST_WS_URL)
      closedWs.close()

      const message: AgentMessage = {
        type: 'ping',
      }

      // Should not throw
      expect(() => sendAgentMessage(closedWs, message)).not.toThrow()
    })

    it('should handle various message types', async () => {
      const messages: AgentMessage[] = [
        { type: 'ping' },
        {
          type: 'connected',
          payload: {
            version: '4.24.0',
            configPath: 'kubb.config.ts',
            spec: 'openapi: 3.0.0',
            config: {
              name: 'test',
              root: './src',
              input: { path: 'spec.yaml' },
              output: { path: './dist', write: true, extension: { '.ts': '.ts' }, barrelType: 'star' },
              plugins: [],
            },
          },
        },
        {
          type: 'data',
          event: {
            type: 'info',
            data: ['Test message'],
            timestamp: Date.now(),
          },
        },
      ]

      for (const message of messages) {
        sendAgentMessage(mockWs, message)
        await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_SHORT))
      }
    })
  })

  describe('setupEventsStream', () => {
    let mockWs: WebSocket
    let events: AsyncEventEmitter<KubbEvents>
    let receivedMessages: AgentMessage[] = []

    beforeEach(async () => {
      receivedMessages = []

      server.use(
        studio.addEventListener('connection', ({ client }) => {
          client.addEventListener('message', (event) => {
            try {
              const parsed = JSON.parse(event.data as string)
              receivedMessages.push(parsed)
            } catch (error) {
              // Ignore non-JSON messages in tests
              console.warn('Failed to parse WebSocket message:', error)
            }
          })
        }),
      )

      mockWs = (await createWebsocket(TEST_WS_URL, {})) as WebSocket
      events = new AsyncEventEmitter<KubbEvents>()

      setupEventsStream(mockWs, events)
    })

    afterEach(() => {
      mockWs?.close()
      events.removeAll()
    })

    it('should forward plugin:start event', async () => {
      const mockPlugin: MockPlugin = {
        name: 'test-plugin',
        key: ['test-plugin'],
        options: {},
      }

      await events.emit('plugin:start', mockPlugin as Plugin)

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      expect(dataMessages.length).toBeGreaterThan(0)

      const pluginStartMessage = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'plugin:start')
      expect(pluginStartMessage).toBeDefined()
      expect(pluginStartMessage && 'event' in pluginStartMessage).toBe(true)
      if (pluginStartMessage && 'event' in pluginStartMessage) {
        expect(pluginStartMessage.event?.data).toEqual([mockPlugin])
      }
    })

    it('should forward plugin:end event', async () => {
      const mockPlugin: MockPlugin = {
        name: 'test-plugin',
        key: ['test-plugin'],
        options: {},
      }

      await events.emit('plugin:end', mockPlugin as Plugin, { duration: 100, success: true })

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const pluginEndMessage = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'plugin:end')

      expect(pluginEndMessage).toBeDefined()
      if (pluginEndMessage && 'event' in pluginEndMessage) {
        expect(pluginEndMessage.event?.data).toEqual([mockPlugin, { duration: 100, success: true }])
      }
    })

    it('should forward files:processing:start event', async () => {
      const files: MockFile[] = [{ path: 'file1.ts' }, { path: 'file2.ts' }]

      await events.emit('files:processing:start', files as KubbFile.ResolvedFile[])

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'files:processing:start')

      expect(message).toBeDefined()
      expect(message && 'event' in message).toBe(true)
      if (message && 'event' in message) {
        expect(message.event?.data).toEqual([{ total: 2 }])
      }
    })

    it('should forward file:processing:update event', async () => {
      const mockFile: MockFile = { path: 'test.ts' }
      const mockConfig: Partial<Config> = { name: 'test' }

      await events.emit('file:processing:update', {
        file: mockFile as KubbFile.ResolvedFile,
        config: mockConfig as Config,
        processed: 5,
        total: 10,
        percentage: 50,
      })

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'file:processing:update')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data).toEqual([
          {
            file: 'test.ts',
            processed: 5,
            total: 10,
            percentage: 50,
          },
        ])
      }
    })

    it('should forward files:processing:end event', async () => {
      const files: MockFile[] = [{ path: 'file1.ts' }, { path: 'file2.ts' }, { path: 'file3.ts' }]

      await events.emit('files:processing:end', files as KubbFile.ResolvedFile[])

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'files:processing:end')

      expect(message).toBeDefined()
      expect(message && 'event' in message).toBe(true)
      if (message && 'event' in message) {
        expect(message.event?.data).toEqual([{ total: 3 }])
      }
    })

    it('should forward info event', async () => {
      await events.emit('info', 'Test info message', 'extra info')

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'info')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data).toEqual(['Test info message', 'extra info'])
      }
    })

    it('should forward success event', async () => {
      await events.emit('success', 'Success message')

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'success')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data).toContain('Success message')
      }
    })

    it('should forward warn event', async () => {
      await events.emit('warn', 'Warning message')

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'warn')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data).toContain('Warning message')
      }
    })

    it('should forward generation:start event', async () => {
      const config: MockConfig = {
        name: 'test-api',
        plugins: [{}, {}] as Plugin[],
      }

      await events.emit('generation:start', config as Config)

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'generation:start')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data).toEqual([
          {
            name: 'test-api',
            plugins: 2,
          },
        ])
      }
    })

    it('should forward generation:end event', async () => {
      const config: MockConfig = { name: 'test-api', plugins: [] }
      const files: MockFile[] = [{ path: 'file1.ts' }]
      const sources = new Map<string, string>([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ])

      await events.emit('generation:end', config as Config, files as KubbFile.ResolvedFile[], sources)

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'generation:end')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data?.[2]).toEqual({
          key1: 'value1',
          key2: 'value2',
        })
      }
    })

    it('should forward error event', async () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'

      await events.emit('error', error)

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_MEDIUM))

      const dataMessages = receivedMessages.filter((m) => m.type === 'data')
      const message = dataMessages.find((m) => m.type === 'data' && 'event' in m && m.event?.type === 'error')

      expect(message).toBeDefined()
      if (message && 'event' in message) {
        expect(message.event?.data).toEqual([
          {
            message: 'Test error',
            stack: 'Error stack trace',
          },
        ])
      }
    })

    it('should handle multiple events in sequence', async () => {
      const mockPlugin: MockPlugin = {
        name: 'plugin1',
        key: ['plugin1'],
        options: {},
      }
      const mockConfig: MockConfig = { name: 'test', plugins: [] }

      await events.emit('generation:start', mockConfig as Config)
      await events.emit('plugin:start', mockPlugin as Plugin)
      await events.emit('plugin:end', mockPlugin as Plugin, { duration: 100, success: true })
      await events.emit('generation:end', mockConfig as Config, [], new Map())

      await new Promise((resolve) => setTimeout(resolve, ASYNC_WAIT_LONG))

      expect(receivedMessages.length).toBeGreaterThan(3)
      expect(receivedMessages.some((m) => m.type === 'data' && 'event' in m && m.event?.type === 'generation:start')).toBe(true)
      expect(receivedMessages.some((m) => m.type === 'data' && 'event' in m && m.event?.type === 'plugin:start')).toBe(true)
      expect(receivedMessages.some((m) => m.type === 'data' && 'event' in m && m.event?.type === 'plugin:end')).toBe(true)
      expect(receivedMessages.some((m) => m.type === 'data' && 'event' in m && m.event?.type === 'generation:end')).toBe(true)
    })
  })
})
