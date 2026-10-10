import { x } from 'tinyexec'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectTool, FORMATTER_PREFERENCE, formatters, LINTER_PREFERENCE, linters, tokenize } from './tools.ts'

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

function makeResult(exitCode: number | null): ReturnType<typeof x> {
  const output = exitCode === null ? Promise.reject(new Error('not found')) : Promise.resolve({ stdout: '', stderr: '', exitCode })
  return output as unknown as ReturnType<typeof x>
}

describe('detectTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the first candidate when available', async () => {
    vi.mocked(x).mockImplementation((command: string) => {
      return makeResult(command === 'oxfmt' ? 0 : 1)
    })

    expect(await detectTool(['oxfmt', 'biome', 'prettier'])).toBe('oxfmt')
  })

  it('skips missing candidates and returns the first available one', async () => {
    vi.mocked(x).mockImplementation((command: string) => {
      return makeResult(command === 'biome' ? 0 : 1)
    })

    expect(await detectTool(['oxfmt', 'biome', 'prettier'])).toBe('biome')
  })

  it('returns null when no candidate is available', async () => {
    vi.mocked(x).mockImplementation(() => makeResult(null))

    expect(await detectTool(['oxlint', 'biome', 'eslint'])).toBeNull()
  })

  it('probes from the given working directory', async () => {
    vi.mocked(x).mockImplementation(() => makeResult(0))

    await detectTool(['oxfmt'], '/repo/app')

    expect(x).toHaveBeenCalledWith('oxfmt', ['--version'], { throwOnError: false, nodeOptions: { cwd: '/repo/app', stdio: 'ignore' } })
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
