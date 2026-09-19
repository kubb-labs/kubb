import { describe, expect, it, vi } from 'vitest'
import * as env from '../../utils/env.ts'
import * as utils from './utils.ts'
import { run } from './run.ts'

type BootstrapOptions = {
  /**
   * Reject the config load, so the group has a failure to report.
   */
  fail?: boolean
  reporters?: Array<'cli' | 'json'>
}

/**
 * Runs the command with no configs to generate, so only the bootstrap Configuration group renders.
 * Non-rich, so the group is plain text an assertion can read.
 */
async function bootstrap({ fail = false, reporters }: BootstrapOptions = {}) {
  const lines: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
  using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(false)
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))
  using _warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  using _fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
  using _exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`)
  }) as never)
  using _configs = vi
    .spyOn(utils, 'getConfigs')
    .mockImplementation(() =>
      fail ? Promise.reject(new Error('Config not defined')) : Promise.resolve({ configs: [], configPath: `${process.cwd()}/kubb.config.ts` }),
    )

  await run({ logLevel: 'info', watch: false, reporters }).catch((error: Error) => void lines.push(error.message))

  return lines
}

describe('bootstrap configuration group', () => {
  it('spins while the config loads and reports what it loaded', async () => {
    const lines = await bootstrap()

    expect(lines).toContain('Loading config')
    expect(lines).toContain('Loaded kubb.config.ts')
    expect(lines).toContain('0 configs ready')
  })

  it('marks the step failed and closes the group when the config cannot load', async () => {
    const lines = await bootstrap({ fail: true })

    expect(lines).toContain('✗ Config failed loading')
    expect(lines).toContain('✗ Configuration failed')
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('does not repeat the config path once the group has reported it', async () => {
    const lines = await bootstrap()

    expect(lines.filter((line) => line.includes('Config loaded'))).toStrictEqual([])
  })

  it('writes nothing of its own when json owns stdout', async () => {
    const lines = await bootstrap({ reporters: ['json'] })

    expect(lines).toStrictEqual([])
  })
})
