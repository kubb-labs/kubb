import { describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as env from '../utils/env.ts'
import { createSpinner, logIntro, logInfo, logOutro } from './output.ts'

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

  it('prints the title and its warning instead of opening a block', () => {
    expect(capturePlain(() => logIntro({ title: 'Kubb Studio', warning: 'Use with caution' }))).toEqual(['Kubb Studio', 'Use with caution', ''])
  })

  it('prints every step the spinner was given, so nothing is lost without an animation', () => {
    const lines = capturePlain(() => {
      const spinner = createSpinner()
      spinner.start('Installing packages')
      spinner.stop('Installed packages')
    })

    expect(lines).toEqual(['Installing packages', 'Installed packages'])
  })
})

describe('rich output', () => {
  it('hands the text to clack', () => {
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(true)

    logOutro('Disconnected')
    logInfo('Connected')

    expect(prompts.outro).toHaveBeenCalledWith('Disconnected')
    expect(prompts.log.info).toHaveBeenCalledWith('Connected')
  })
})
