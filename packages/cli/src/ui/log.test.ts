import { describe, expect, it, vi } from 'vitest'
import * as env from '../utils/env.ts'
import { logInfo } from './log.ts'

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
})
