import { describe, expect, it } from 'vitest'
import { callTool, useFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { updateTool } from './update.ts'

await useFakeKubbProject()

describe('update tool', () => {
  it('updates every installed extension when no extensionIds are given', async () => {
    const { isError, text } = await callTool(updateTool, {})

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['update', '--yes'])
  })

  it('passes each id as a positional argument, and --dry-run', async () => {
    const { text } = await callTool(updateTool, { extensionIds: ['plugin-zod', 'plugin-ts'], dryRun: true })

    expect(echoedArgs(text)).toEqual(['update', 'plugin-zod', 'plugin-ts', '--yes', '--dry-run'])
  })
})
