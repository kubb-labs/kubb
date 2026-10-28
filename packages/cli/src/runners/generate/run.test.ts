import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { type Config, fsStorage, type PostGenerateCommand, resolveCacheDir, resolveMeta, type UserConfig } from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as config from '../../config.ts'
import * as env from '../../utils/env.ts'
import { run } from './run.ts'

type BootstrapOptions = {
  /**
   * Reject the config load, with this error or a plain one, so the group has a failure to report.
   */
  fail?: boolean | Error
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
  // What reached stdout alone, since `json` keeps it for the report.
  const stdout: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
  using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(false)
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => {
    lines.push(String(line))
    stdout.push(String(line))
  })
  using _warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  using _error = vi.spyOn(console, 'error').mockImplementation((line = '') => void lines.push(String(line)))
  using _fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
  using _exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`)
  }) as never)
  using _configs = vi
    .spyOn(config, 'getConfigs')
    .mockImplementation(() =>
      fail
        ? Promise.reject(fail instanceof Error ? fail : new Error('Config not defined'))
        : Promise.resolve({ configs, configPath: `${process.cwd()}/kubb.config.ts` }),
    )

  await run({ logLevel: 'info', watch: false, reporters }).catch((error: Error) => void lines.push(error.message))
  // A failed build sets `exitCode` instead of calling `exit()`, so telemetry can finish; record it the same way.
  if (process.exitCode) lines.push(`exit ${process.exitCode}`)
  process.exitCode = undefined

  return Object.assign(lines, { stdout })
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

  it('reports a diagnostic thrown while the config file runs with its code', async () => {
    // An extension with neither `meta.name` nor `name` throws KUBB_INVALID_PLUGIN_OPTIONS.
    const cause = (() => {
      try {
        resolveMeta({})
      } catch (error) {
        return error
      }
    })()

    const lines = await bootstrap({ fail: new Error('Config failed loading', { cause }) })

    expect(lines.some((line) => line.includes('error KUBB_INVALID_PLUGIN_OPTIONS') && line.includes('neither `meta.name` nor `name`'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('writes a config failure to stderr, not stdout, when json owns stdout', async () => {
    const lines = await bootstrap({ fail: new Error('Config failed loading: kubb.config.ts', { cause: new Error('boom') }), reporters: ['json'] })

    expect(lines.stdout).toStrictEqual([])
    expect(lines.some((line) => line.includes('Config failed loading: kubb.config.ts'))).toBe(true)
    expect(lines.some((line) => line.includes('caused by: boom'))).toBe(true)
  })

  it('writes nothing of its own when json owns stdout', async () => {
    const lines = await bootstrap({ reporters: ['json'] })

    expect([...lines]).toStrictEqual([])
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

    expect(lines.some((line) => line.startsWith('✗ Generation failed') && line.includes('1 error'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })
})

describe('output passes', () => {
  const node = process.execPath
  const petStore = fileURLToPath(new URL('../../../../core/mocks/petStore.yaml', import.meta.url))
  const roots: Array<string> = []

  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
      rmSync(resolveCacheDir(root), { recursive: true, force: true })
    }
  })

  /**
   * A config whose build succeeds in a temp root, so only `output.postGenerate` decides the outcome.
   */
  function withPostGenerate(postGenerate: Array<PostGenerateCommand>): Config {
    const root = mkdtempSync(join(tmpdir(), 'kubb-cli-run-'))
    roots.push(root)
    const config = {
      root,
      input: petStore,
      output: { path: './gen', format: false, lint: false, postGenerate },
      adapter: adapterOas(),
      plugins: [],
      storage: fsStorage(),
    } satisfies UserConfig

    return config as unknown as Config
  }

  it('runs the post-generate hooks from core and reports each one', async () => {
    const lines = await bootstrap({ configs: [withPostGenerate([{ name: 'types', command: `"${node}" -e "process.exit(0)"` }])] })

    expect(lines.some((line) => line.startsWith('✓ types in '))).toBe(true)
    expect(lines.some((line) => line.startsWith('Post-generate hooks completed in '))).toBe(true)
    expect(lines.some((line) => line.startsWith('✓ Generation complete'))).toBe(true)
    expect(lines.filter((line) => line.startsWith('exit '))).toStrictEqual([])
  })

  it('fails the run when a post-generate hook exits non-zero', async () => {
    const lines = await bootstrap({ configs: [withPostGenerate([{ name: 'types', command: `"${node}" -e "process.exit(1)"` }])] })

    expect(lines.some((line) => line.startsWith('✗ types failed (Hook execute failed: '))).toBe(true)
    expect(lines.some((line) => line.startsWith('error KUBB_POST_GENERATE_FAILED: Post-generate command failed: '))).toBe(true)
    expect(lines.some((line) => line.startsWith('✗ Generation failed') && line.includes('1 error'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })
})
