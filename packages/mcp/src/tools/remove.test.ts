import { describe, expect, it } from 'vitest'
import { callTool, useFakeKubbProject, echoedArgs } from '../mocks/fakeKubb.ts'
import { removeTool } from './remove.ts'

await useFakeKubbProject()

describe('remove tool', () => {
  it('runs kubb remove with --yes', async () => {
    const { isError, text } = await callTool(removeTool, { extensionId: 'plugin-zod' })

    expect(isError).toBe(false)
    expect(echoedArgs(text)).toEqual(['remove', 'plugin-zod', '--yes'])
  })

  it('passes --no-uninstall and --dry-run', async () => {
    const { text } = await callTool(removeTool, { extensionId: 'plugin-zod', uninstall: false, dryRun: true })

    expect(echoedArgs(text)).toEqual(['remove', 'plugin-zod', '--yes', '--no-uninstall', '--dry-run'])
  })

  it('refuses a config without a config extension', async () => {
    const { isError, text } = await callTool(removeTool, { extensionId: 'plugin-zod', configPath: 'secrets.json' })

    expect(isError).toBe(true)
    expect(text).toContain('Invalid config file extension')
  })
})
