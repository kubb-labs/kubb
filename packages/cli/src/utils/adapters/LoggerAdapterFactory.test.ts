import { describe, expect, it } from 'vitest'
import { ClackAdapter } from './ClackAdapter.ts'
import { GitHubActionsAdapter } from './GitHubActionsAdapter.ts'
import { LoggerAdapterFactory } from './LoggerAdapterFactory.ts'
import { PlainAdapter } from './PlainAdapter.ts'

describe('LoggerAdapterFactory', () => {
  it('should create ClackAdapter', () => {
    const adapter = LoggerAdapterFactory.create('clack', { logLevel: 3 })
    expect(adapter).toBeInstanceOf(ClackAdapter)
    expect(adapter.name).toBe('clack')
  })

  it('should create GitHubActionsAdapter', () => {
    const adapter = LoggerAdapterFactory.create('github-actions', { logLevel: 3 })
    expect(adapter).toBeInstanceOf(GitHubActionsAdapter)
    expect(adapter.name).toBe('github-actions')
  })

  it('should create PlainAdapter', () => {
    const adapter = LoggerAdapterFactory.create('plain', { logLevel: 3 })
    expect(adapter).toBeInstanceOf(PlainAdapter)
    expect(adapter.name).toBe('plain')
  })

  it('should throw error for unknown adapter type', () => {
    expect(() => {
      // @ts-expect-error - Testing invalid type
      LoggerAdapterFactory.create('unknown', { logLevel: 3 })
    }).toThrow('Unknown adapter type')
  })

  it('should detect adapter type automatically', () => {
    const adapterType = LoggerAdapterFactory.detectAdapter()
    expect(['clack', 'github-actions', 'plain']).toContain(adapterType)
  })

  it('should create adapter automatically', () => {
    const adapter = LoggerAdapterFactory.createAuto({ logLevel: 3 })
    expect(adapter).toBeDefined()
    expect(adapter.name).toBeDefined()
  })
})
