import { adapterOas } from '@kubb/adapter-oas'
import type { Config, UserConfig } from '@kubb/core'
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
  /**
   * Configs the mocked loader returns. Empty renders only the Configuration group.
   */
  configs?: Array<Config>
}

/**
 * Runs the command with no configs to generate, so only the bootstrap Configuration group renders.
 * Non-rich, so the group is plain text an assertion can read.
 */
async function bootstrap({ fail = false, reporters, configs = [] }: BootstrapOptions = {}) {
  const lines: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
  using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(false)
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))
  using _warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  using _error = vi.spyOn(console, 'error').mockImplementation((line = '') => void lines.push(String(line)))
  using _fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
  using _exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`)
  }) as never)
  using _configs = vi
    .spyOn(utils, 'getConfigs')
    .mockImplementation(() =>
      fail ? Promise.reject(new Error('Config not defined')) : Promise.resolve({ configs, configPath: `${process.cwd()}/kubb.config.ts` }),
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

  it('writes nothing of its own when json owns stdout', async () => {
    const lines = await bootstrap({ reporters: ['json'] })

    expect(lines).toStrictEqual([])
  })
})

describe('reporters', () => {
  it('reports a failure for a config written without defineConfig', async () => {
    const config = {
      root: process.cwd(),
      input: './does-not-exist.yaml',
      output: { path: './gen', format: false, lint: false },
      adapter: adapterOas(),
      plugins: [],
    } satisfies UserConfig

    // `getConfigs` hands the exported object through as a `Config`, without `reporters`.
    const lines = await bootstrap({ configs: [config as unknown as Config] })

    expect(lines.some((line) => line.includes('✗'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })
})
