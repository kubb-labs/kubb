import { realpath, rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { resolveCliBin, runCli, runKubb } from './cli.ts'
import { createFakeKubbProject, type ToolResult } from './mocks/fakeKubb.ts'

const { root, bin } = await createFakeKubbProject()
const textOf = (result: ToolResult) => result.content.map((part) => part.text ?? '').join('\n')

afterEach(() => {
  vi.unstubAllEnvs()
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('resolveCliBin', () => {
  it('finds the kubb bin installed in the project', async () => {
    // Module resolution returns the real path, and tmpdir() is a symlink on macOS.
    expect(await resolveCliBin(root)).toBe(await realpath(bin))
  })
})

describe('runCli', () => {
  it('passes each argument as is, without a shell, and strips ANSI styling', async () => {
    const result = await runCli({ bin, args: ['add', 'plugin-zod', '$(echo hi)', '--yes'], cwd: root })

    expect(result.exitCode).toBe(0)
    expect(result.output).toContain('["add","plugin-zod","$(echo hi)","--yes"]')
    expect(result.output).toContain('to stderr')
    expect(result.output).not.toContain('\u001b[')
  })

  it('reports the signal when the timeout kills the run', async () => {
    vi.stubEnv('FAKE_KUBB_HANG', '1')

    const result = await runCli({ bin, args: [], cwd: root, timeout: 200 })

    expect(result.exitCode).toBeNull()
    expect(result.signal).toBe('SIGTERM')
  })
})

describe('runKubb', () => {
  it('returns an error for a non-zero exit', async () => {
    using _ = vi.spyOn(process, 'cwd').mockReturnValue(root)
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const result = (await runKubb({ args: ['generate'] })) as ToolResult

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Exit code: 1')
  })

  it('returns text when isSuccess accepts the exit code', async () => {
    using _ = vi.spyOn(process, 'cwd').mockReturnValue(root)
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const result = (await runKubb({ args: ['generate'], isSuccess: (code) => code <= 1 })) as ToolResult

    expect(result.isError).toBeFalsy()
  })

  it('returns an error for a run the timeout killed, even when isSuccess accepts every code', async () => {
    using _ = vi.spyOn(process, 'cwd').mockReturnValue(root)
    vi.stubEnv('FAKE_KUBB_HANG', '1')

    const result = (await runKubb({ args: ['generate'], isSuccess: () => true, timeout: 200 })) as ToolResult

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Stopped by SIGTERM')
  })
})
