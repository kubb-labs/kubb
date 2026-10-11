import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearCredentials, getMachineId, getProjectKubbHome, writeCredentials } from './credentials.ts'

describe('getProjectKubbHome', () => {
  it('returns a persistence directory keyed by project path', () => {
    expect(getProjectKubbHome('/projects/one')).toBe(getProjectKubbHome('/projects/one'))
    expect(getProjectKubbHome('/projects/one')).not.toBe(getProjectKubbHome('/projects/two'))
  })
})

describe('getMachineId', () => {
  let home: string | undefined

  afterEach(async () => {
    vi.unstubAllEnvs()
    if (home) await rm(home, { recursive: true, force: true })
  })

  it('keeps one id per project, even after the credential is cleared', async () => {
    home = await mkdtemp(path.join(tmpdir(), 'kubb-home-'))
    vi.stubEnv('KUBB_HOME', home)

    const id = await getMachineId()
    await writeCredentials({ studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' })
    await clearCredentials()

    expect(id).toMatch(/^[0-9a-f]{64}$/)
    await expect(getMachineId()).resolves.toBe(id)
  })

  it.skipIf(process.platform === 'win32')('creates the secret readable by its owner only', async () => {
    home = await mkdtemp(path.join(tmpdir(), 'kubb-home-'))
    vi.stubEnv('KUBB_HOME', home)

    await getMachineId()

    expect((await stat(path.join(getProjectKubbHome(), 'machine-secret'))).mode & 0o777).toBe(0o600)
  })
})
