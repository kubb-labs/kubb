import { describe, expect, it, vi } from 'vitest'
import * as env from '../utils/env.ts'
import { createSpinner, getBanner, logIntro, logInfo, withSpinner } from './output.ts'

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn(),
  log: { message: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), step: vi.fn() },
}))

/**
 * Captures what the plain writers print, with rich output turned off.
 */
function capturePlain(run: () => void): Array<string> {
  const lines: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))
  using _warn = vi.spyOn(console, 'warn').mockImplementation((line = '') => void lines.push(String(line)))

  run()

  return lines
}

describe('plain output', () => {
  it('prefixes a message with the same symbol the plain logger uses', () => {
    expect(capturePlain(() => logInfo('Detected pnpm'))).toEqual(['ℹ Detected pnpm'])
  })

  it.each([
    { title: 'Kubb Studio', expected: ['Kubb Studio', 'Use with caution', ''], label: 'the title and its warning' },
    { title: undefined, expected: ['Use with caution', ''], label: 'a warning without a duplicate title' },
  ])('prints $label instead of opening a block', ({ title, expected }) => {
    expect(capturePlain(() => logIntro({ title, warning: 'Use with caution' }))).toEqual(expected)
  })

  it('prints every step the spinner was given, so nothing is lost without an animation', () => {
    const lines = capturePlain(() => {
      const spinner = createSpinner()
      spinner.start('Installing packages')
      spinner.stop('Installed packages')
    })

    expect(lines).toEqual(['Installing packages', 'Installed packages'])
  })

  it('marks a failed step, so it does not read as finished', () => {
    const lines = capturePlain(() => {
      const spinner = createSpinner()
      spinner.start('Linting')
      spinner.error('Linting failed')
    })

    expect(lines).toEqual(['Linting', '✗ Linting failed'])
  })
})

describe('getBanner', () => {
  it('falls back to one version line where the mascot cannot be drawn', () => {
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)

    expect(getBanner('5.0.0', 'add')).toBe('Kubb CLI v5.0.0')
  })
})

describe('withSpinner', () => {
  it('shows no spinner when the wait ends within 150 ms, and one after that', async () => {
    vi.useFakeTimers()
    const lines: Array<string> = []
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
    using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))

    const fast = withSpinner({ promise: Promise.resolve('fast'), message: 'Reading the registry' })
    await vi.advanceTimersByTimeAsync(200)
    const slow = withSpinner({ promise: new Promise((resolve) => setTimeout(() => resolve('slow'), 300)), message: 'Reading the registry' })
    await vi.advanceTimersByTimeAsync(300)

    expect([await fast, await slow]).toStrictEqual(['fast', 'slow'])
    expect(lines).toStrictEqual(['Reading the registry'])
    vi.useRealTimers()
  })
})
