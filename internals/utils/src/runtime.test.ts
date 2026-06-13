import { afterEach, describe, expect, it, vi } from 'vitest'
import { runtime } from './runtime.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Runtime', () => {
  it('detects Node when no Bun or Deno global is present', () => {
    expect(runtime.isNode).toBe(true)
    expect(runtime.isBun).toBe(false)
    expect(runtime.isDeno).toBe(false)
    expect(runtime.name).toBe('node')
    expect(runtime.version).toBe(process.versions.node)
  })

  it('detects Bun from the global Bun object', () => {
    vi.stubGlobal('Bun', {})
    expect(runtime.isBun).toBe(true)
    expect(runtime.isNode).toBe(false)
    expect(runtime.name).toBe('bun')
  })

  it('detects Deno from the global Deno object and reads its version', () => {
    vi.stubGlobal('Deno', { version: { deno: '1.2.3' } })
    expect(runtime.isDeno).toBe(true)
    expect(runtime.isNode).toBe(false)
    expect(runtime.name).toBe('deno')
    expect(runtime.version).toBe('1.2.3')
  })
})
