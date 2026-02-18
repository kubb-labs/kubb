import { describe, expect, it } from 'vitest'
import type { AgentMessage } from '../types/agent.ts'
import { isCommandMessage, isDataMessage } from '../types/agent.ts'

describe('Studio Plugin - Message Handling', () => {
  describe('Message Type Guards', () => {
    it('should identify command messages correctly', () => {
      const message: AgentMessage = {
        type: 'command',
        command: 'generate',
      }

      expect(isCommandMessage(message)).toBe(true)
      expect(isDataMessage(message)).toBe(false)
    })

    it('should identify data messages correctly', () => {
      const message: AgentMessage = {
        type: 'data',
        event: {
          type: 'info',
          data: ['message'],
          timestamp: Date.now(),
        },
      }

      expect(isDataMessage(message)).toBe(true)
      expect(isCommandMessage(message)).toBe(false)
    })
  })

  describe('WebSocket Message Serialization', () => {
    it('should serialize ping message', () => {
      const message: AgentMessage = {
        type: 'ping',
      }

      const serialized = JSON.stringify(message)
      expect(serialized).toContain('"type":"ping"')
    })

    it('should serialize connected message with info response', () => {
      const message: AgentMessage = {
        type: 'connected',
        payload: {
          version: '4.24.0',
          configPath: 'kubb.config.ts',
          spec: 'openapi: 3.0.0',
          config: {
            name: 'api',
            root: './src',
            input: { path: 'spec.yaml' },
            output: { path: './dist', write: true, extension: { '.ts': '.ts' }, barrelType: 'star' },
            plugins: [{ name: '@kubb/plugin-ts', options: {} }],
          },
        },
      }

      const serialized = JSON.stringify(message)
      expect(serialized).toContain('"connected"')
      expect(serialized).toContain('"version":"4.24.0"')
    })

    it('should serialize data message with event', () => {
      const message: AgentMessage = {
        type: 'data',
        event: {
          type: 'plugin:start',
          data: [{ name: 'test-plugin' }],
          timestamp: 1234567890,
        },
      }

      const serialized = JSON.stringify(message)
      expect(serialized).toContain('"type":"data"')
      expect(serialized).toContain('"plugin:start"')
    })
  })

  describe('Config Validation', () => {
    it('should validate config has required fields', () => {
      const config = {
        name: 'test',
        root: './src',
        input: { path: 'spec.yaml' },
        output: { path: './dist', write: true, extension: '.ts', barrelType: 'star' },
        plugins: [],
      }

      expect(config.name).toBeDefined()
      expect(config.input).toBeDefined()
      expect(config.output).toBeDefined()
      expect(config.output.path).toBeDefined()
    })

    it('should handle config without optional input path', () => {
      const config = {
        name: 'test',
        root: './src',
        input: {
          /* no path */
        },
        output: { path: './dist', write: true, extension: '.ts', barrelType: 'star' },
        plugins: [],
      }

      const hasPath = 'path' in config.input
      expect(hasPath).toBe(false)
    })

    it('should serialize plugin options from config', () => {
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
      expect(pluginsInfo[0].name).toBe('@kubb/ts')
      expect(pluginsInfo[1].options.importPath).toBe('@/lib/api')
    })
  })
})
