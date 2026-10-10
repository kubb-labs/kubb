import { afterEach, describe, expect, it, vi } from 'vitest'

const { runGenerate, runSnapshot } = vi.hoisted(() => ({
  runGenerate: vi.fn(async (_options: { logLevel?: string }) => undefined),
  runSnapshot: vi.fn(async (_ctx: { values: { packageVersion?: string } }) => undefined),
}))

vi.mock('../runners/generate/run.ts', () => ({
  run: runGenerate,
}))

vi.mock('../runners/studio/snapshot.ts', () => ({
  runner: runSnapshot,
}))

describe('multi-word flag spellings', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    runGenerate.mockClear()
    runSnapshot.mockClear()
  })

  it.each([
    { flag: '--log-level', argv: ['generate', '--log-level', 'verbose'], expected: 'verbose', resolve: () => runGenerate.mock.calls[0]?.[0].logLevel },
    { flag: '--logLevel', argv: ['generate', '--logLevel', 'verbose'], expected: 'verbose', resolve: () => runGenerate.mock.calls[0]?.[0].logLevel },
    {
      flag: '--package-version',
      argv: ['studio', 'snapshot', '--package-version', '1.2.3'],
      expected: '1.2.3',
      resolve: () => runSnapshot.mock.calls[0]?.[0].values.packageVersion,
    },
    {
      flag: '--packageVersion',
      argv: ['studio', 'snapshot', '--packageVersion', '1.2.3'],
      expected: '1.2.3',
      resolve: () => runSnapshot.mock.calls[0]?.[0].values.packageVersion,
    },
  ])('resolves $flag to the same value as its other spelling', async ({ argv, expected, resolve }) => {
    using _error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')

    const { run } = await import('../index.ts')
    await run(argv)

    expect(resolve()).toBe(expected)
  })
})
