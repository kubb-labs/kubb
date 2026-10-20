import { describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as env from '../utils/env.ts'
import { logIntro } from './intro.ts'

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
  it.each([
    { title: 'Kubb Studio', expected: ['Kubb Studio', 'Use with caution', ''], label: 'the title and its warning' },
    { title: undefined, expected: ['Use with caution', ''], label: 'a warning without a duplicate title' },
  ])('prints $label instead of opening a block', ({ title, expected }) => {
    expect(capturePlain(() => logIntro({ title, warning: 'Use with caution' }))).toEqual(expected)
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
