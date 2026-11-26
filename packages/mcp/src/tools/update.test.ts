import { rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool, createFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { updateTool } from './update.ts'

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
