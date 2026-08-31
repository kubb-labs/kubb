import { describe, expect, it } from 'vitest'
import type { AgentMessage } from './index.ts'
import { isCommandMessage, isDataMessage, isDisconnectMessage } from './index.ts'

describe('agent protocol', () => {
  describe('message type guards', () => {
    it('identifies command messages', () => {
      const message: AgentMessage = {
        type: 'command',
        command: 'generate',
        payload: {},
      }

      expect(isCommandMessage(message)).toBe(true)
      expect(isDataMessage(message)).toBe(false)
    })

    it('identifies data messages', () => {
      const message: AgentMessage = {
        type: 'data',
        payload: {
          type: 'kubb:info',
          data: [{ message: 'message' }],
          timestamp: Date.now(),
          seq: 0,
        },
      }

      expect(isDataMessage(message)).toBe(true)
      expect(isCommandMessage(message)).toBe(false)

      const event = isDataMessage(message, 'kubb:info') ? message : undefined
      expect(event?.payload.type).toStrictEqual('kubb:info')
    })

    it('identifies a disconnect message with reason "expired"', () => {
      const message: AgentMessage = { type: 'disconnect', reason: 'expired' }

      expect(isDisconnectMessage(message)).toBe(true)
      expect(isCommandMessage(message)).toBe(false)
      expect(isDataMessage(message)).toBe(false)
    })

    it('identifies a disconnect message with reason "revoked"', () => {
      const message: AgentMessage = { type: 'disconnect', reason: 'revoked' }

      expect(isDisconnectMessage(message)).toBe(true)
      if (isDisconnectMessage(message)) {
        expect(message.reason).toBe('revoked')
      }
    })
  })

  describe('websocket message serialization', () => {
    it('serializes a ping message', () => {
      const message: AgentMessage = {
        type: 'ping',
      }

      const serialized = JSON.stringify(message)
      expect(serialized).toContain('"type":"ping"')
    })

    it('serializes a disconnect message with reason', () => {
      const expired: AgentMessage = { type: 'disconnect', reason: 'expired' }
      const revoked: AgentMessage = { type: 'disconnect', reason: 'revoked' }

      expect(JSON.parse(JSON.stringify(expired))).toStrictEqual({
        type: 'disconnect',
        reason: 'expired',
      })
      expect(JSON.parse(JSON.stringify(revoked))).toStrictEqual({
        type: 'disconnect',
        reason: 'revoked',
      })
    })

    it('serializes a connected message with an info response', () => {
      const message: AgentMessage = {
        type: 'connected',
        payload: {
          versions: {
            kubb: '4.24.0',
            agent: '1.0.0',
          },
          configPath: 'kubb.config.ts',
          root: '/workspace',
          permissions: {
            allowWrite: true,
            allowInput: false,
          },
          config: {
            plugins: [{ name: '@kubb/plugin-ts', options: {} }],
          },
        },
      }

      const serialized = JSON.stringify(message)
      expect(serialized).toContain('"connected"')
      expect(serialized).toContain('"kubb":"4.24.0"')
    })

    it('serializes a data message with an event', () => {
      const message: AgentMessage = {
        type: 'data',
        payload: {
          type: 'kubb:plugin:start',
          data: [{ plugin: { name: 'test-plugin' } }],
          timestamp: 1234567890,
          seq: 0,
        },
      }

      const serialized = JSON.stringify(message)
      expect(serialized).toContain('"type":"data"')
      expect(serialized).toContain('"kubb:plugin:start"')
    })
  })

  describe('config validation', () => {
    it('validates that a config has required fields', () => {
      const config = {
        name: 'test',
        root: './src',
        input: 'spec.yaml',
        output: {
          path: './dist',
          write: true,
          extension: '.ts',
          barrel: { type: 'all' },
        },
        plugins: [],
      }

      expect(config.name).toBeDefined()
      expect(config.input).toBeDefined()
      expect(config.output).toBeDefined()
      expect(config.output.path).toBeDefined()
    })

    it('handles a string input', () => {
      const config = {
        name: 'test',
        root: './src',
        input: 'spec.yaml',
        output: {
          path: './dist',
          write: true,
          extension: '.ts',
          barrel: { type: 'all' },
        },
        plugins: [],
      }

      expect(typeof config.input).toBe('string')
    })

    it('serializes plugin options from a config', () => {
      const plugins = [
        {
          name: 'ts',
          options: { enumType: 'const', esmInterop: true },
        },
        {
          name: 'client',
          options: { importPath: '@/lib/api' },
        },
      ]

      const pluginsInfo = plugins.map((plugin) => ({
        name: `@kubb/${plugin.name}`,
        options: plugin.options,
      }))

      expect(pluginsInfo).toHaveLength(2)
      expect(pluginsInfo[0]?.name).toBe('@kubb/ts')
      expect(pluginsInfo[1]?.options.importPath).toBe('@/lib/api')
    })
  })
})
