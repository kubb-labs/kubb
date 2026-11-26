import { describe, expect, it } from 'vitest'
import { callTool, useFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { addTool } from './add.ts'

await useFakeKubbProject()

describe('add tool', () => {
  it('runs kubb add with --yes', async () => {
    const { isError, text } = await callTool(addTool, { extensionId: 'plugin-zod' })

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['add', 'plugin-zod', '--yes'])
  })

  it('passes --config, --no-install, and --dry-run', async () => {
    const { text } = await callTool(addTool, { extensionId: 'kubb-labs/plugin-zod', configPath: 'kubb.config.ts', install: false, dryRun: true })

    expect(echoedArgs(text)).toEqual([
      'add',
      'kubb-labs/plugin-zod',
      '--yes',
      '--no-install',
      '--dry-run',
      '--config',
      expect.stringMatching(/kubb\.config\.ts$/),
    ])
  })

  it('refuses a config outside the working directory without running the CLI', async () => {
    const { isError, text } = await callTool(addTool, { extensionId: 'plugin-zod', configPath: '../kubb.config.ts' })

    expect(isError).toBe(true)
    expect(text).toContain('must be within the current working directory')
    expect(echoedArgs(text)).toEqual([])
  })
})
