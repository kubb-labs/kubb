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
    confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    await expect(resolvePermissions(options, credentials)).resolves.toEqual({ allowWrite: true, allowInput: false, allowExec: true })
    expect(confirm).toHaveBeenCalledTimes(3)
    expect(writeCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        projects: { [process.cwd()]: { allowWrite: true, allowInput: false, allowExec: true } },
      }),
    )
  })

  it('asks nothing again once the project answered, and never stores a flag-granted permission', async () => {
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: { allowWrite: false, allowInput: false, allowExec: false } } }

    await expect(resolvePermissions({ ...options, allowExec: true }, stored)).resolves.toEqual({
      allowWrite: false,
      allowInput: false,
      allowExec: true,
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })
})
