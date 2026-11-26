import { rm } from 'node:fs/promises'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool, createFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { addTool } from './add.ts'

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

describe('add tool', () => {
  it('runs kubb add with --yes', async () => {
    const { isError, text } = await callTool(addTool, { id: 'plugin-zod' })

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['add', 'plugin-zod', '--yes'])
  })

  it('passes --config, --no-install, and --dry-run', async () => {
    const { text } = await callTool(addTool, { id: 'kubb-labs/plugin-zod', config: 'kubb.config.ts', install: false, dryRun: true })

    expect(echoedArgs(text)).toEqual([
      'add',
      'kubb-labs/plugin-zod',
      '--config',
      expect.stringMatching(/kubb\.config\.ts$/),
      '--yes',
      '--no-install',
      '--dry-run',
    ])
  })

  it('refuses a config outside the working directory without running the CLI', async () => {
    const { isError, text } = await callTool(addTool, { id: 'plugin-zod', config: '../kubb.config.ts' })

    expect(isError).toBe(true)
    expect(text).toContain('must be within the current working directory')
    expect(echoedArgs(text)).toEqual([])
  })
})
