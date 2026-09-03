import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectTool, FORMATTER_PREFERENCE, formatters, LINTER_PREFERENCE, linters, tokenize } from './tools.ts'

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

  it('returns null when no candidate is available', async () => {
    vi.mocked(spawn).mockImplementation(() => makeChild(null))

    expect(await detectTool(['oxlint', 'biome', 'eslint'])).toBeNull()
  })
})

describe('tool tables', () => {
  it.each([...FORMATTER_PREFERENCE])('has a descriptor for the %s formatter', (name) => {
    expect(formatters[name].command).toBe(name)
  })

  it.each([...LINTER_PREFERENCE])('has a descriptor for the %s linter', (name) => {
    expect(linters[name].command).toBe(name)
  })
})

describe('tokenize', () => {
  it('splits on whitespace', () => {
    expect(tokenize('oxlint --fix ./src')).toStrictEqual(['oxlint', '--fix', './src'])
  })

  it('keeps a double-quoted argument together and strips the quotes', () => {
    expect(tokenize('git commit -m "initial commit"')).toStrictEqual(['git', 'commit', '-m', 'initial commit'])
  })

  it('keeps a single-quoted argument together', () => {
    expect(tokenize("echo 'hello world'")).toStrictEqual(['echo', 'hello world'])
  })

  it('returns nothing for an empty command', () => {
    expect(tokenize('   ')).toStrictEqual([])
  })
})
