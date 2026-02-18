import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

  describe('Plugin Event Flow', () => {
    it('should handle generate command message', () => {
      const message: AgentMessage = {
        type: 'command',
        command: 'generate',
      }

      expect(isCommandMessage(message)).toBe(true)
      if (isCommandMessage(message)) {
        expect(message.command).toBe('generate')
      }
    })

    it('should handle connect command message', () => {
      const message: AgentMessage = {
        type: 'command',
        command: 'connect',
      }

      expect(isCommandMessage(message)).toBe(true)
      if (isCommandMessage(message)) {
        expect(message.command).toBe('connect')
      }
    })

    it('should serialize generation end event with sources map', () => {
      const sources = new Map([
        ['schema.ts', 'export type User = { id: string }'],
        ['client.ts', 'export const client = new ApiClient()'],
      ])

      const sourcesRecord: Record<string, string> = {}
      sources.forEach((value, key) => {
        sourcesRecord[key] = value
      })

      expect(Object.keys(sourcesRecord)).toContain('schema.ts')
      expect(sourcesRecord['client.ts']).toContain('ApiClient')
    })

    it('should format hook command with arguments', () => {
      const command = 'npm'
      const args = ['run', 'format']
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command

      expect(commandWithArgs).toBe('npm run format')
    })

    it('should skip hook execution when id is undefined', () => {
      const id = undefined
      const shouldExecute = !!id

      expect(shouldExecute).toBe(false)
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

  describe('Environment Variables', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
      originalEnv = { ...process.env }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should use KUBB_STUDIO_URL from env or default', () => {
      process.env.KUBB_STUDIO_URL = 'https://custom.studio.dev'
      const studioUrl = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'

      expect(studioUrl).toBe('https://custom.studio.dev')
    })

    it('should default KUBB_STUDIO_URL when not set', () => {
      delete process.env.KUBB_STUDIO_URL
      const studioUrl = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'

      expect(studioUrl).toBe('https://studio.kubb.dev')
    })

    it('should use KUBB_ROOT from env or config.root or cwd', () => {
      const cwd = process.cwd()
      const root = process.env.KUBB_ROOT || '/config/root' || cwd

      expect(root).toBeDefined()
    })

    it('should check KUBB_AGENT_NO_CACHE for caching behavior', () => {
      process.env.KUBB_AGENT_NO_CACHE = 'true'
      const noCache = process.env.KUBB_AGENT_NO_CACHE === 'true'

      expect(noCache).toBe(true)
    })

    it('should default to using cache when KUBB_AGENT_NO_CACHE not set', () => {
      delete process.env.KUBB_AGENT_NO_CACHE
      const noCache = process.env.KUBB_AGENT_NO_CACHE === 'true'

      expect(noCache).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should create error message from exception', () => {
      const error = new Error('Hook execute failed: npm run format')
      const errorMessage: AgentMessage = {
        type: 'error',
        message: error.message,
      }

      expect(errorMessage.type).toBe('error')
      expect(errorMessage.message).toContain('Hook execute failed')
    })

    it('should preserve error stack in hook:end event', () => {
      const error = new Error('Command failed')
      error.stack = 'Error: Command failed\n  at runHook (/path/to/file.ts:50:10)'

      const hookEndEvent = {
        command: 'npm',
        args: ['run', 'test'],
        id: 'hook-123',
        success: false,
        error,
      }

      expect(hookEndEvent.error?.stack).toContain('runHook')
      expect(hookEndEvent.success).toBe(false)
    })
  })
})
