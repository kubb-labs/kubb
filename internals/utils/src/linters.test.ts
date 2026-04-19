import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectLinter } from './linters.ts'

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

describe('detectLinter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect oxlint when available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'oxlint' ? 0 : 1)
    })

    const result = await detectLinter()
    expect(result).toBe('oxlint')
  })

  it('should detect eslint when oxlint is not available', async () => {
    vi.mocked(spawn).mockImplementation((command: string) => {
      return makeChild(command === 'eslint' ? 0 : 1)
    })

    const result = await detectLinter()
    expect(result).toBe('eslint')
  })

  it('should return null when no linter is available', async () => {
    vi.mocked(spawn).mockImplementation(() => makeChild(null))

    const result = await detectLinter()
    expect(result).toBeNull()
  })
})
