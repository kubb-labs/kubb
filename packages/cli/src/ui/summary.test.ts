import { describe, expect, it, vi } from 'vitest'
import { stripVTControlCharacters } from 'node:util'
import * as prompts from '@clack/prompts'
import * as env from '../utils/env.ts'
import { logCommandSummary } from './summary.ts'

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn(),
  log: { message: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), step: vi.fn() },
}))

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
