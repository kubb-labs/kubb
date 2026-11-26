import { describe, expect, it, vi } from 'vitest'
import { callTool, useFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { listTool } from './list.ts'

await useFakeKubbProject()

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
