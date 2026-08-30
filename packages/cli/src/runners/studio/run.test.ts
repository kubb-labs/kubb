import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import type { Credentials } from './credentials.ts'
import { resolvePermissions, type StudioOptions } from './run.ts'

vi.mock('@clack/prompts', () => ({ confirm: vi.fn() }))
vi.mock('@internals/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@internals/utils')>()),
  isCIEnvironment: () => false,
  canUseTTY: () => true,
}))
vi.mock('./credentials.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./credentials.ts')>()),
  writeCredentials: vi.fn().mockResolvedValue(undefined),
}))

const { writeCredentials } = await import('./credentials.ts')
const confirm = vi.mocked(prompts.confirm)

const options: StudioOptions = {
  action: 'connect',
  version: '0.0.0',
  studioUrl: 'http://localhost:3000',
  allowWrite: false,
  allowConfigEdit: false,
  allowInput: false,
  allowExec: false,
  open: false,
}

const credentials: Credentials = { studioUrl: options.studioUrl, token: 'token', agentId: 'id', agentSlug: 'slug' }

beforeEach(() => {
  confirm.mockReset()
  vi.mocked(writeCredentials).mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('resolvePermissions', () => {
  it('asks for every permission and stores the answers', async () => {
    confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true }

    await expect(resolvePermissions(options, credentials)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(4)
    expect(writeCredentials).toHaveBeenCalledWith(expect.objectContaining({ projects: { [process.cwd()]: answers } }))
  })

  it('asks for editing kubb.config.ts on its own, not as part of writing generated files', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials)

    // The project path is machine-specific, so it is stood in for rather than snapshotted.
    const questions = confirm.mock.calls.map(([call]) => call?.message?.replace(process.cwd(), '<project>'))
    expect(questions).toMatchInlineSnapshot(`
      [
        "Let Kubb Studio write generated files into <project>?",
        "Let Kubb Studio change plugin options in kubb.config.ts?",
        "Let Kubb Studio generate from an OpenAPI spec it sends, instead of the one on disk?",
        "Let Kubb Studio run the formatter, the linter, and output.postGenerate?",
      ]
    `)
  })

  it('names the config the project actually has, not the default', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials, 'configs/kubb.config.mjs')

    expect(confirm.mock.calls.map(([call]) => call?.message).find((message) => message?.includes('plugin options'))).toMatchInlineSnapshot(
      `"Let Kubb Studio change plugin options in configs/kubb.config.mjs?"`,
    )
  })

  it('asks nothing again once the project answered, and never stores a flag-granted permission', async () => {
    const remembered = { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false }
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: remembered } }

    await expect(resolvePermissions({ ...options, allowExec: true }, stored)).resolves.toEqual({ ...remembered, allowExec: true })
    expect(confirm).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })
})
