import { describe, expect, it, vi } from 'vitest'
import { stripVTControlCharacters } from 'node:util'
import * as prompts from '@clack/prompts'
import * as env from '../utils/env.ts'
import { createSpinner, formatTable, logCommandSummary, logIntro, logInfo, wantsMascot, withSpinner } from './output.ts'

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

describe('rich intro', () => {
  it('leaves the opening guide to the first prompt when there is no title', () => {
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(true)
    vi.mocked(prompts.intro).mockClear()
    vi.mocked(prompts.log.warn).mockClear()

    logIntro({ warning: 'Use with caution' })

    expect(prompts.intro).not.toHaveBeenCalled()
    expect(prompts.log.warn).toHaveBeenCalledWith('Use with caution')
  })
})

describe('command summaries', () => {
  it('closes an interactive block with the outcome before its details', () => {
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(true)
    vi.mocked(prompts.outro).mockClear()
    logCommandSummary({ title: 'Plugin ready', status: 'success', hrStart: process.hrtime(), lines: ['  Plugin  plugin-ts'], block: true })
    expect(prompts.outro).toHaveBeenCalledOnce()
    const summary = stripVTControlCharacters(vi.mocked(prompts.outro).mock.calls[0]![0]!)
    expect(summary).toMatch(/^✓ Plugin ready\s+\S+\n\n {2}Plugin {2}plugin-ts$/)
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

describe('wantsMascot', () => {
  const ask = (commandPath: Array<string>, values: Record<string, unknown> = {}, tty = true) => {
    const original = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    Object.defineProperty(process.stdin, 'isTTY', { value: tty, configurable: true })
    try {
      return wantsMascot({ commandPath, values })
    } finally {
      if (original) Object.defineProperty(process.stdin, 'isTTY', original)
      else Reflect.deleteProperty(process.stdin, 'isTTY')
    }
  }

  it('opens generate and interactive commands with the mascot, and quick or scripted runs without it', () => {
    expect(ask(['generate'])).toBe(true)
    expect(ask(['init'])).toBe(true)
    expect(ask(['init'], { yes: true })).toBe(false)
    expect(ask(['add'], {}, false)).toBe(false)
    expect(ask(['generate'], { help: true })).toBe(false)
    expect(ask(['validate'])).toBe(false)
  })
})

describe('formatTable', () => {
  it('pads each column to its widest cell', () => {
    expect(
      formatTable([
        ['a', 'bb'],
        ['ccc', 'd'],
      ]),
    ).toStrictEqual(['a    bb', 'ccc  d'])
  })
})
