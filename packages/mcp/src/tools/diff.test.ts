import { rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool, createFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { diffTool } from './diff.ts'

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
})
