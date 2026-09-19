import { describe, expect, it, vi } from 'vitest'
import * as env from '../../utils/env.ts'
import * as utils from './utils.ts'
import { run } from './run.ts'

/**
 * Runs the command with no configs to generate, so only the bootstrap Configuration group renders.
 */
async function bootstrap({ rich, fail = false }: { rich: boolean; fail?: boolean }) {
  const lines: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(rich)
  using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(rich)
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

  await run({ logLevel: 'info', watch: false }).catch((error: Error) => void lines.push(error.message))

  return lines
}

describe('bootstrap configuration group', () => {
  it('spins while the config loads and reports what it loaded', async () => {
    const lines = await bootstrap({ rich: false })

    expect(lines).toContain('Loading config')
    expect(lines).toContain('Loaded kubb.config.ts')
    expect(lines).toContain('0 configs ready')
  })

  it('marks the step failed and closes the group when the config cannot load', async () => {
    const lines = await bootstrap({ rich: false, fail: true })

    expect(lines).toContain('✗ Config failed loading')
    expect(lines).toContain('✗ Configuration failed')
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('does not repeat the config path once the group has reported it', async () => {
    const lines = await bootstrap({ rich: false })

    expect(lines.filter((line) => line.includes('Config loaded'))).toStrictEqual([])
  })
})
