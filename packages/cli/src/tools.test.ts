import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectTool } from './tools.ts'

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}))

import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'

function makeChild(exitCode: number | null): ChildProcess {
  const child = new EventEmitter() as unknown as ChildProcess
  setTimeout(() => {
    if (exitCode !== null) child.emit('close', exitCode)
    else child.emit('error', new Error('not found'))
  }, 0)
  return child
}

describe('detectTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the first candidate when available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'oxfmt' ? 0 : 1)
    })

    expect(await detectTool(['oxfmt', 'biome', 'prettier'])).toBe('oxfmt')
  })

  it('skips missing candidates and returns the first available one', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'biome' ? 0 : 1)
    })

    expect(await detectTool(['oxfmt', 'biome', 'prettier'])).toBe('biome')
  })

  it('returns the last candidate when only it is available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'eslint' ? 0 : 1)
    })

    expect(await detectTool(['oxlint', 'biome', 'eslint'])).toBe('eslint')
  })

  it('returns null when no candidate is available', async () => {
    vi.mocked(spawn).mockImplementation(() => makeChild(null))

    expect(await detectTool(['oxlint', 'biome', 'eslint'])).toBeNull()
  })
})
