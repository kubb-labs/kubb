import { rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool, createFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { listTool } from './list.ts'

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

describe('list tool', () => {
  it('runs kubb list', async () => {
    const { isError, text } = await callTool(listTool, {})

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['list'])
  })

  it('returns an error when kubb list fails', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const { isError } = await callTool(listTool, {})

    expect(isError).toBe(true)
  })
})
