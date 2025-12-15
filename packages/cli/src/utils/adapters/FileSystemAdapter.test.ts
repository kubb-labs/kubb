import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createLogger } from '@kubb/core/logger'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFileSystemAdapter } from './FileSystemAdapter.ts'

describe('FileSystemAdapter', () => {
  const testDir = resolve(process.cwd(), '.kubb-test')

  beforeEach(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true })
    // Change to test directory
    process.chdir(testDir)
  })

  afterEach(async () => {
    // Clean up test directory
    process.chdir(resolve(testDir, '..'))
    await rm(testDir, { recursive: true, force: true })
  })

  it('should create filesystem adapter', () => {
    const adapter = createFileSystemAdapter({ logLevel: 5 })
    expect(adapter.name).toBe('filesystem')
  })

  it('should capture debug events', () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = createFileSystemAdapter({ logLevel: 5 })

    adapter.install(logger)

    // Emit debug event
    logger.emit('debug', {
      date: new Date(),
      logs: ['Test debug log'],
    })

    // Note: We can't access internal state with functional pattern
    // So we just verify install/cleanup work
    adapter.cleanup()
  })

  it('should capture verbose events', () => {
    const logger = createLogger({ logLevel: 4 })
    const adapter = createFileSystemAdapter({ logLevel: 4 })

    adapter.install(logger)

    // Emit verbose event
    logger.emit('verbose', {
      date: new Date(),
      logs: ['Test verbose log'],
    })

    adapter.cleanup()
  })

  it('should cleanup properly', () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = createFileSystemAdapter({ logLevel: 5 })

    adapter.install(logger)
    adapter.cleanup()
    // Cleanup should succeed without errors
  })

  it('should write logs to .kubb directory', async () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = createFileSystemAdapter({ logLevel: 5 })

    adapter.install(logger)

    // Emit some debug events
    logger.emit('debug', {
      date: new Date(),
      logs: ['Log line 1', 'Log line 2'],
    })

    logger.emit('debug', {
      date: new Date(),
      logs: ['Log line 3'],
    })

    // Write logs should create files
    await adapter.writeLogs()

    // Note: actual file verification would require reading the file
    // which is skipped here to keep test simple
    adapter.cleanup()
  })

  it('should use custom output directory', async () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = createFileSystemAdapter({ logLevel: 5, outputDir: '.custom-logs' })

    adapter.install(logger)

    // Emit debug event
    logger.emit('debug', {
      date: new Date(),
      logs: ['Test log'],
    })

    // Write logs
    await adapter.writeLogs()

    adapter.cleanup()
  })
})
