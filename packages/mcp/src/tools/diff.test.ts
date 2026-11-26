import { rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool, createFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { MAX_OUTPUT_CHARS } from '../utils.ts'
import { diffTool } from './diff.ts'

const patch = (file: string, lines = 1) =>
  [
    `--- a/${file}`,
    `+++ b/${file}`,
    `@@ -1,1 +1,${lines} @@`,
    '-export type Old = string',
    ...Array.from({ length: lines }, (_, index) => `+export type New${index} = string`),
  ].join('\n')

const { root } = await createFakeKubbProject()

beforeEach(() => {
  vi.spyOn(process, 'cwd').mockReturnValue(root)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('diff tool', () => {
  it('runs kubb generate --diff', async () => {
    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['generate', '--diff'])
  })

  it('passes --no-lockfile', async () => {
    const { text } = await callTool(diffTool, { lockfile: false })

    expect(echoedArgs(text)).toEqual(['generate', '--diff', '--no-lockfile'])
  })

  it('treats exit code 1, out of date, as an answer', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(false)
    expect(text).toContain('Exit code: 1')
  })

  it('returns an error for exit code 2, a failed run', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '2')

    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(true)
    expect(text).toContain('Exit code: 2')
  })

  it('returns one line per file for the summary format', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')
    vi.stubEnv('FAKE_KUBB_OUTPUT', [patch('src/gen/pet.ts', 2), patch('src/gen/order.ts')].join('\n'))

    const { isError, text } = await callTool(diffTool, { format: 'summary' })

    expect(isError).toBe(false)
    expect(text).toContain('Exit code: 1')
    expect(text).toContain('2 generated files are out of date:\nsrc/gen/pet.ts (+2 -1)\nsrc/gen/order.ts (+1 -1)')
    expect(text).not.toContain('@@')
  })

  it('returns the CLI output for the summary format when nothing is out of date', async () => {
    const { text } = await callTool(diffTool, { format: 'summary' })

    expect(text).toContain('to stderr')
  })

  it('cuts a diff over the limit, says so, and lists every out-of-date file', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')
    vi.stubEnv('FAKE_KUBB_OUTPUT', [patch('src/gen/pet.ts', 2_000), patch('src/gen/order.ts')].join('\n'))

    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(false)
    expect(text.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS)
    expect(text).toMatch(/\[Output cut: showing the first \d+ of \d+ characters\./)
    expect(text).toContain('2 generated files are out of date:\nsrc/gen/pet.ts (+2000 -1)\nsrc/gen/order.ts (+1 -1)')
  })
})
