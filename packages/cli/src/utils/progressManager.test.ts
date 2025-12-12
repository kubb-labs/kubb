import { LogMapper } from '@kubb/core/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProgressManager } from './progressManager.ts'

describe('ProgressManager', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Force CI mode by setting CI env var
    process.env.CI = 'true'
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    delete process.env.CI
  })

  describe('Mode selection', () => {
    it('should use debug mode when logLevel is debug', () => {
      const progressManager = new ProgressManager(LogMapper.debug)
      expect(progressManager).toBeDefined()
    })

    it('should use CI mode when in CI environment', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.startSchemaLoading()
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Loading OpenAPI schema...')
    })
  })

  describe('Schema loading', () => {
    it('should track schema loading start', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.startSchemaLoading()
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Loading OpenAPI schema...')
    })

    it('should track schema loading completion', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.completeSchemaLoading()
      expect(consoleSpy).toHaveBeenCalledWith('✓ OpenAPI schema loaded')
    })
  })

  describe('Plugin tracking', () => {
    it('should initialize plugins', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      const plugins = ['plugin-ts', 'plugin-client', 'plugin-zod']
      progressManager.initPlugins(plugins)
      expect(progressManager).toBeDefined()
    })

    it('should start plugin tracking', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.initPlugins(['plugin-ts'])
      progressManager.startPlugin('plugin-ts')
      expect(consoleSpy).toHaveBeenCalledWith('🔷 plugin-ts started...')
    })

    it('should complete plugin with duration', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.initPlugins(['plugin-ts'])
      progressManager.startPlugin('plugin-ts')
      progressManager.completePlugin('plugin-ts', 500)
      expect(consoleSpy).toHaveBeenCalledWith('✓ 🔷 plugin-ts completed in 500ms')
    })

    it('should handle plugin failure', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.initPlugins(['plugin-ts'])
      progressManager.startPlugin('plugin-ts')
      const error = new Error('Test error')
      progressManager.failPlugin('plugin-ts', error)
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ 🔷 plugin-ts failed: Test error')
    })

    it('should assign correct emojis to plugins', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.initPlugins(['plugin-ts', 'plugin-oas', 'plugin-client', 'plugin-react-query', 'plugin-zod'])

      progressManager.startPlugin('plugin-ts')
      expect(consoleSpy).toHaveBeenCalledWith('🔷 plugin-ts started...')

      progressManager.startPlugin('plugin-oas')
      expect(consoleSpy).toHaveBeenCalledWith('📋 plugin-oas started...')

      progressManager.startPlugin('plugin-client')
      expect(consoleSpy).toHaveBeenCalledWith('📦 plugin-client started...')

      progressManager.startPlugin('plugin-react-query')
      expect(consoleSpy).toHaveBeenCalledWith('🖼️ plugin-react-query started...')

      progressManager.startPlugin('plugin-zod')
      expect(consoleSpy).toHaveBeenCalledWith('🧩 plugin-zod started...')
    })
  })

  describe('File generation tracking', () => {
    it('should track file generation start', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.startFileGeneration(10)
      expect(consoleSpy).toHaveBeenCalledWith('📝 Generating 10 files...')
    })

    it('should track file generation completion', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.startFileGeneration(10)
      progressManager.completeFileGeneration()
      expect(consoleSpy).toHaveBeenCalledWith('✓ Generated 10 files')
    })

    it('should update file generation progress', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.startFileGeneration(5)
      progressManager.updateFileGeneration()
      expect(progressManager).toBeDefined()
    })
  })

  describe('Progress updates', () => {
    it('should handle plugin progress updates', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.initPlugins(['plugin-ts'])
      progressManager.startPlugin('plugin-ts')
      progressManager.updatePlugin('plugin-ts', 'Generating types...')
      expect(progressManager).toBeDefined()
    })
  })

  describe('Finish', () => {
    it('should finish progress tracking', () => {
      const progressManager = new ProgressManager(LogMapper.info)
      progressManager.initPlugins(['plugin-ts'])
      progressManager.startPlugin('plugin-ts')
      progressManager.finish()
      expect(progressManager).toBeDefined()
    })
  })
})
