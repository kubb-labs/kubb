import { existsSync } from 'node:fs'
import { realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { KILL_GRACE_MS, resolveCliBin, runCli, runKubb, TIMEOUT_MS } from './cli.ts'
import { MAX_OUTPUT_CHARS } from './utils.ts'
import { type ToolResult, useFakeKubbProject } from './mocks/fakeKubb.ts'

const { root, bin } = await useFakeKubbProject()
const textOf = (result: ToolResult) => result.content.map((part) => part.text ?? '').join('\n')

describe('resolveCliBin', () => {
  it('finds the kubb bin installed in the project', async () => {
    // Module resolution returns the real path, and tmpdir() is a symlink on macOS.
    expect(await resolveCliBin()).toBe(await realpath(bin))
  })
})

describe('runCli', () => {
  it('passes each argument as is, without a shell, and strips ANSI styling', async () => {
    const result = await runCli({ bin, args: ['add', 'plugin-zod', '$(echo hi)', '--yes'] })

    expect(result.exitCode).toBe(0)
    expect(result.output).toContain('["add","plugin-zod","$(echo hi)","--yes"]')
    expect(result.output).toContain('to stderr')
    expect(result.output).not.toContain('\u001b[')
    expect(result.stdout).toBe('["add","plugin-zod","$(echo hi)","--yes"]')
    expect(result.stderr).toBe('to stderr')
  })

  it('reports the signal that ended the run', async () => {
    vi.stubEnv('FAKE_KUBB_SIGNAL', '1')

    const result = await runCli({ bin, args: [] })

    expect(result.exitCode).toBeNull()
    expect(result.signal).toBe('SIGTERM')
  })
  it('sends SIGTERM after the timeout, then SIGKILL to a run that ignores it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.stubEnv('FAKE_KUBB_STUCK', '1')

    const running = runCli({ bin, args: [] })
    await vi.waitFor(() => expect(existsSync(join(root, 'ready'))).toBe(true))
    vi.advanceTimersByTime(TIMEOUT_MS)
    await vi.waitFor(() => expect(existsSync(join(root, 'sigterm'))).toBe(true))
    vi.advanceTimersByTime(KILL_GRACE_MS)
    const result = await running

    vi.useRealTimers()
    expect(result.signal).toBe('SIGKILL')
  })
})

describe('runKubb', () => {
  it('returns an error for a non-zero exit', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const result = (await runKubb({ args: ['generate'] })) as ToolResult

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Exit code: 1')
  })

  it('returns text when isSuccess accepts the exit code', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const result = (await runKubb({ args: ['generate'], isSuccess: (code) => code <= 1 })) as ToolResult

    expect(result.isError).toBeFalsy()
  })

  it('returns an error for a run a signal ended, even when isSuccess accepts every code', async () => {
    vi.stubEnv('FAKE_KUBB_SIGNAL', '1')

    const result = (await runKubb({ args: ['generate'], isSuccess: () => true })) as ToolResult

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Stopped by SIGTERM')
  })

  it('appends an absolute --config for a configPath inside the working directory', async () => {
    const result = (await runKubb({ args: ['add', 'plugin-zod'], configPath: 'kubb.config.ts' })) as ToolResult

    expect(textOf(result)).toContain(`$ kubb add plugin-zod --config ${join(root, 'kubb.config.ts')}`)
  })

  it('refuses a configPath outside the working directory without running the CLI', async () => {
    const result = (await runKubb({ args: ['add', 'plugin-zod'], configPath: '../kubb.config.ts' })) as ToolResult

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('must be within the current working directory')
    expect(textOf(result)).not.toContain('$ kubb')
  })

  it('passes stdout and stderr apart to formatOutput', async () => {
    const result = (await runKubb({ args: ['list'], formatOutput: ({ stdout, stderr }) => `${stderr} | ${stdout}` })) as ToolResult

    expect(textOf(result)).toContain('to stderr | ["list"]')
  })

  it('cuts output over the limit and adds the hint to the notice', async () => {
    vi.stubEnv('FAKE_KUBB_STDOUT', 'line of output\n'.repeat(MAX_OUTPUT_CHARS / 10))

    const result = (await runKubb({ args: ['list'], truncationHint: () => 'Ask for less.' })) as ToolResult
    const text = textOf(result)

    expect(result.isError).toBeFalsy()
    expect(text.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS)
    expect(text).toMatch(/\[Output cut: showing the first \d+ of \d+ characters\. Ask for less\.\]$/)
  })

  it('leaves output within the limit as is', async () => {
    const result = (await runKubb({ args: ['list'] })) as ToolResult

    expect(textOf(result)).not.toContain('Output cut')
  })
})
