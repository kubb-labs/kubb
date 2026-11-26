import { rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool, createFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { removeTool } from './remove.ts'

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

describe('remove tool', () => {
  it('runs kubb remove with --yes', async () => {
    const { isError, text } = await callTool(removeTool, { id: 'plugin-zod' })

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['remove', 'plugin-zod', '--yes'])
  })

  it('passes --no-uninstall and --dry-run', async () => {
    const { text } = await callTool(removeTool, { id: 'plugin-zod', uninstall: false, dryRun: true })

    expect(echoedArgs(text)).toEqual(['remove', 'plugin-zod', '--yes', '--no-uninstall', '--dry-run'])
  })

  it('refuses a config without a config extension', async () => {
    const { isError, text } = await callTool(removeTool, { id: 'plugin-zod', config: 'secrets.json' })

    expect(isError).toBe(true)
    expect(text).toContain('Invalid config file extension')
  })
})
