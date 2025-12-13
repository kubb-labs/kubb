import { describe, expect, it } from 'vitest'
import { createClackAdapter } from './ClackAdapter.ts'
import { createGitHubActionsAdapter } from './GitHubActionsAdapter.ts'
import { createLoggerAdapter, createLoggerAdapterAuto, detectAdapter } from './LoggerAdapterFactory.ts'
import { createPlainAdapter } from './PlainAdapter.ts'

describe('LoggerAdapterFactory', () => {
  it('should create ClackAdapter', () => {
    const adapter = createLoggerAdapter('clack', { logLevel: 3 })
    expect(adapter.name).toBe('clack')
  })

  it('should create GitHubActionsAdapter', () => {
    const adapter = createLoggerAdapter('github-actions', { logLevel: 3 })
    expect(adapter.name).toBe('github-actions')
  })

  it('should create PlainAdapter', () => {
    const adapter = createLoggerAdapter('plain', { logLevel: 3 })
    expect(adapter.name).toBe('plain')
  })

  it('should throw error for unknown adapter type', () => {
    expect(() => {
      // @ts-expect-error - Testing invalid type
      createLoggerAdapter('unknown', { logLevel: 3 })
    }).toThrow('Unknown adapter type')
  })

  it('should detect adapter type automatically', () => {
    const adapterType = detectAdapter()
    expect(['clack', 'github-actions', 'plain']).toContain(adapterType)
  })

  it('should create adapter automatically', () => {
    const adapter = createLoggerAdapterAuto({ logLevel: 3 })
    expect(adapter).toBeDefined()
    expect(adapter.name).toBeDefined()
  })

  it('should create adapter using factory functions directly', () => {
    const clackAdapter = createClackAdapter({ logLevel: 3 })
    expect(clackAdapter.name).toBe('clack')

    const ghAdapter = createGitHubActionsAdapter({ logLevel: 3 })
    expect(ghAdapter.name).toBe('github-actions')

    const plainAdapter = createPlainAdapter({ logLevel: 3 })
    expect(plainAdapter.name).toBe('plain')
  })
})
