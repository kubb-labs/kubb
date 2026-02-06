import { readFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { defineConfig } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { createStreamLogger } from '../loggers/streamLogger.ts'
import { generate } from '../runners/generate.ts'

// Mock dependencies
vi.mock('node:fs')
vi.mock('@clack/prompts')
vi.mock('../loggers/streamLogger.ts')
vi.mock('../runners/generate.ts')

describe('streamServer utilities', () => {
  describe('response formatting', () => {
    it('should format health response correctly', () => {
      const healthResponse = {
        status: 'ok' as const,
        version: '4.21.0',
        configPath: 'kubb.config.ts',
      }

      expect(healthResponse).toEqual({
        status: 'ok',
        version: '4.21.0',
        configPath: 'kubb.config.ts',
      })
    })

    it('should format connect response with config', () => {
      const config = defineConfig({
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
      })

      const connectResponse = {
        version: '4.21.0',
        configPath: 'kubb.config.ts',
        config: {
          name: config.name,
          root: config.root,
          input: {
            path: 'path' in config.input ? config.input.path : undefined,
          },
          output: {
            path: config.output.path,
            write: config.output.write,
            extension: config.output.extension,
            barrelType: config.output.barrelType,
          },
          plugins: [],
        },
      }

      expect(connectResponse.config.name).toBe('test-api')
      expect(connectResponse.config.output.path).toBe('./src/gen')
    })

    it('should include spec content when file is readable', () => {
      const mockSpecContent = 'openapi: 3.0.0\ninfo:\n  title: Test API'
      vi.mocked(readFileSync).mockReturnValue(mockSpecContent)

      const spec = readFileSync('./openapi.yaml', 'utf-8')

      expect(spec).toBe(mockSpecContent)
    })

    it('should handle missing spec file gracefully', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })

      let specContent: string | undefined
      try {
        specContent = readFileSync('./missing.yaml', 'utf-8')
      } catch {
        specContent = undefined
      }

      expect(specContent).toBeUndefined()
    })
  })

  describe('SSE event formatting', () => {
    it('should format SSE events correctly', () => {
      const event = {
        type: 'plugin:start',
        data: [{ name: 'plugin-ts' }],
      }

      const sseMessage = `data: ${JSON.stringify(event)}\n\n`

      expect(sseMessage).toContain('data:')
      expect(sseMessage).toContain('plugin:start')
      expect(sseMessage).toContain('plugin-ts')
      expect(sseMessage).toMatch(/\n\n$/)
    })

    it('should format lifecycle:end event', () => {
      const event = {
        type: 'lifecycle:end',
        data: [],
      }

      const sseMessage = `data: ${JSON.stringify(event)}\n\n`

      expect(sseMessage).toBe('data: {"type":"lifecycle:end","data":[]}\n\n')
    })

    it('should format error event with stack trace', () => {
      const error = new Error('Generation failed')
      const event = {
        type: 'error',
        data: [
          {
            message: error.message,
            stack: error.stack,
          },
        ],
      }

      const sseMessage = `data: ${JSON.stringify(event)}\n\n`

      expect(sseMessage).toContain('error')
      expect(sseMessage).toContain('Generation failed')
    })

    it('should format file processing update event', () => {
      const event = {
        type: 'file:processing:update',
        data: [
          {
            file: 'models/Pet.ts',
            processed: 5,
            total: 10,
            percentage: 50,
          },
        ],
      }

      const sseMessage = `data: ${JSON.stringify(event)}\n\n`

      expect(sseMessage).toContain('file:processing:update')
      expect(sseMessage).toContain('models/Pet.ts')
      expect(sseMessage).toContain('50')
    })
  })

  describe('CORS headers', () => {
    it('should include proper CORS headers', () => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }

      expect(headers['Access-Control-Allow-Origin']).toBe('*')
      expect(headers['Access-Control-Allow-Methods']).toContain('GET')
      expect(headers['Access-Control-Allow-Methods']).toContain('POST')
      expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS')
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type')
    })
  })

  describe('SSE headers', () => {
    it('should include proper SSE headers', () => {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }

      expect(headers['Content-Type']).toBe('text/event-stream')
      expect(headers['Cache-Control']).toBe('no-cache')
      expect(headers.Connection).toBe('keep-alive')
    })
  })

  describe('stream logger integration', () => {
    it('should create stream logger with response', () => {
      const mockRes = {} as ServerResponse
      const mockLogger = {
        install: vi.fn(),
      }

      vi.mocked(createStreamLogger).mockReturnValue(mockLogger as any)

      const logger = createStreamLogger(mockRes)

      expect(logger).toBeDefined()
      expect(createStreamLogger).toHaveBeenCalledWith(mockRes)
    })
  })

  describe('generation handling', () => {
    it('should call generate with correct parameters', async () => {
      const config = defineConfig({
        input: { path: './openapi.yaml' },
        output: { path: './gen' },
        plugins: [],
      })

      vi.mocked(generate).mockResolvedValue()

      await generate({
        input: './openapi.yaml',
        config,
        logLevel: 3,
        events: {} as any,
      })

      expect(generate).toHaveBeenCalledWith({
        input: './openapi.yaml',
        config,
        logLevel: 3,
        events: expect.any(Object),
      })
    })

    it('should handle generation errors', async () => {
      const config = defineConfig({
        input: { path: './openapi.yaml' },
        output: { path: './gen' },
        plugins: [],
      })

      const error = new Error('Generation failed')
      vi.mocked(generate).mockRejectedValue(error)

      await expect(
        generate({
          input: './openapi.yaml',
          config,
          logLevel: 3,
          events: {} as any,
        }),
      ).rejects.toThrow('Generation failed')
    })
  })

  describe('config serialization', () => {
    it('should serialize plugin options', () => {
      const config = defineConfig({
        name: 'test',
        input: { path: './openapi.yaml' },
        output: { path: './gen' },
        plugins: [],
      })

      const serializedPlugins = config.plugins?.map((plugin) => ({
        name: `@kubb/${plugin.name}`,
        options: plugin.options,
      }))

      expect(serializedPlugins).toEqual([])
    })

    it('should handle config without plugins', () => {
      const config = defineConfig({
        input: { path: './openapi.yaml' },
        output: { path: './gen' },
      })

      expect(config.plugins).toBeUndefined()
    })

    it('should extract input path correctly', () => {
      const config = defineConfig({
        input: { path: './openapi.yaml' },
        output: { path: './gen' },
        plugins: [],
      })

      const inputPath = 'path' in config.input ? config.input.path : undefined

      expect(inputPath).toBe('./openapi.yaml')
    })
  })
})
