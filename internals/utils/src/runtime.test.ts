import { describe, expect, it } from 'vitest'
import { getRuntimeName, getRuntimeVersion, isBun, isDeno, isNode } from './runtime.ts'

describe('runtime detection', () => {
  it('reports node when the test suite runs under Node', () => {
    expect(isNode()).toBe(true)
    expect(isBun()).toBe(false)
    expect(isDeno()).toBe(false)
  })

  it('returns exactly one active runtime', () => {
    const active = [isBun(), isDeno(), isNode()].filter(Boolean)
    expect(active).toHaveLength(1)
  })

  it('names the active runtime', () => {
    expect(getRuntimeName()).toBe('node')
    expect(['bun', 'deno', 'node']).toContain(getRuntimeName())
  })

  it('reports a non-empty version string for the active runtime', () => {
    expect(getRuntimeVersion()).toBe(process.versions.node)
    expect(typeof getRuntimeVersion()).toBe('string')
  })
})
