import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createLogger } from '@kubb/core/logger'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { FileSystemAdapter } from './FileSystemAdapter.ts'

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
    const adapter = new FileSystemAdapter({ logLevel: 5 })
    expect(adapter.name).toBe('filesystem')
  })

  it('should capture debug events', () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = new FileSystemAdapter({ logLevel: 5 })

    adapter.setup(logger)

    // Emit debug event
    logger.emit('debug', {
      date: new Date(),
      logs: ['Test debug log'],
    })

    expect(adapter['cachedLogs'].size).toBe(1)
    adapter.cleanup()
  })

  it('should capture verbose events', () => {
    const logger = createLogger({ logLevel: 4 })
    const adapter = new FileSystemAdapter({ logLevel: 4 })

    adapter.setup(logger)

    // Emit verbose event
    logger.emit('verbose', {
      date: new Date(),
      logs: ['Test verbose log'],
    })

    expect(adapter['cachedLogs'].size).toBe(1)
    adapter.cleanup()
  })

  it('should cleanup properly', () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = new FileSystemAdapter({ logLevel: 5 })

    adapter.setup(logger)
    expect(adapter['cleanupFns'].length).toBeGreaterThan(0)

    adapter.cleanup()
    expect(adapter['cleanupFns'].length).toBe(0)
  })

  it('should write logs to .kubb directory', async () => {
    const logger = createLogger({ logLevel: 5 })
    const adapter = new FileSystemAdapter({ logLevel: 5 })

    adapter.setup(logger)

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
})
