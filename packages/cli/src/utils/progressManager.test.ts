import { describe, expect, test, vi } from 'vitest'
import { ProgressManager } from './progressManager.ts'

describe('ProgressManager', () => {
  test('should create instance in debug mode', () => {
    const manager = new ProgressManager(true)
    expect(manager).toBeDefined()
  })

  test('should start and stop progress task in debug mode (noop)', () => {
    const manager = new ProgressManager(true)
    
    // In debug mode, these should be no-ops
    expect(() => {
      manager.start('test', { total: 10, message: 'Testing...' })
      manager.update('test', 'Updated')
      manager.stop('test')
    }).not.toThrow()
  })

  test('should create instance in non-debug mode', () => {
    const manager = new ProgressManager(false)
    expect(manager).toBeDefined()
  })

  test('should handle progress updates', () => {
    const manager = new ProgressManager(false)
    
    // Mock console.log to avoid output during tests
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    expect(() => {
      manager.start('test', { total: 10, message: 'Testing...' })
      manager.update('test', 'Updated')
      manager.stop('test')
    }).not.toThrow()
    
    consoleSpy.mockRestore()
  })

  test('should handle stopAll', () => {
    const manager = new ProgressManager(false)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    manager.start('test1', { total: 5, message: 'Test 1' })
    manager.start('test2', { total: 10, message: 'Test 2' })
    
    expect(() => {
      manager.stopAll()
    }).not.toThrow()
    
    consoleSpy.mockRestore()
  })
})
