import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectFormatter } from './formatters.ts'

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}))

import { spawn } from 'node:child_process'

function makeChild(exitCode: number | null) {
  const child = new EventEmitter() as any
  child.stdio = 'ignore'
  setTimeout(() => {
    if (exitCode !== null) child.emit('close', exitCode)
    else child.emit('error', new Error('not found'))
  }, 0)
  return child
}

describe('detectFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect oxfmt when available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'oxfmt' ? 0 : 1)
    })

    const result = await detectFormatter()
    expect(result).toBe('oxfmt')
  })

  it('should detect biome when oxfmt is not available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'biome' ? 0 : 1)
    })

    const result = await detectFormatter()
    expect(result).toBe('biome')
  })

  it('should detect prettier when oxfmt and biome are not available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'prettier' ? 0 : 1)
    })

    const result = await detectFormatter()
    expect(result).toBe('prettier')
  })

  it('should return null when no formatter is available', async () => {
    vi.mocked(spawn).mockImplementation(() => makeChild(null))

    const result = await detectFormatter()
    expect(result).toBeNull()
  })
})
