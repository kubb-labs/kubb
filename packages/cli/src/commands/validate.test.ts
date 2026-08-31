import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { runValidate } = vi.hoisted(() => ({ runValidate: vi.fn(async (_options: { input: string; version: string }) => undefined) }))

vi.mock('../runners/validate/run.ts', () => ({
  run: runValidate,
  runner: async ({ values }: { values: { input: string } }) => runValidate({ input: values.input, version: '' }),
}))

describe('validate command', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    runValidate.mockClear()
    process.exitCode = undefined
  })

  it('forwards the positional input to the validate runner', async () => {
    using _log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')

    const { run } = await import('../index.ts')
    await run(['/usr/bin/node', '/usr/local/bin/kubb', 'validate', './spec.yaml'])

    expect(runValidate).toHaveBeenCalledWith(expect.objectContaining({ input: './spec.yaml' }))
  })

  it('exits with a non-zero code when the input is missing', async () => {
    using _log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using _error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')

    const { run } = await import('../index.ts')
    await expect(run(['/usr/bin/node', '/usr/local/bin/kubb', 'validate'])).rejects.toThrow()

    expect(runValidate).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('rejects unknown options before running the command', async () => {
    using _log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using _error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')

    const { run } = await import('../index.ts')
    await expect(run(['/usr/bin/node', '/usr/local/bin/kubb', 'validate', './spec.yaml', '--typo'])).rejects.toThrow()

    expect(runValidate).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })
})
