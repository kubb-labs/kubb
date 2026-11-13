import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCredentials, getCredentialsPath, getMachineId, getProjectKubbHome, readCredentials, updateCredentials, writeCredentials } from './credentials.ts'

let home: string

beforeEach(async () => {
  home = await mkdtemp(path.join(tmpdir(), 'kubb-home-'))
  vi.stubEnv('KUBB_HOME', home)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(home, { recursive: true, force: true })
})

describe('getMachineId', () => {
  it('keeps one id per project, even after the credential is cleared', async () => {
    const id = await getMachineId()
    await writeCredentials({ studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' })
    await clearCredentials()

    expect(id).toMatch(/^[0-9a-f]{64}$/)
    await expect(getMachineId()).resolves.toBe(id)
  })

  it.skipIf(process.platform === 'win32')('keeps the secret in a folder only its owner can open', async () => {
    await getMachineId()

    expect((await stat(getProjectKubbHome())).mode & 0o777).toBe(0o700)
    expect((await readFile(path.join(getProjectKubbHome(), 'machine-secret'), 'utf8')).length).toBe(64)
  })
})

describe('readCredentials', () => {
  it('reads credentials written before token refresh and agent keys, and keeps the key in the token file', async () => {
    const released = { studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' }
    await writeCredentials(released)
    await expect(readCredentials()).resolves.toStrictEqual(released)

    await writeCredentials({ ...released, issuedAt: '2026-11-13T00:00:00.000Z', privateKey: 'pem' })
    await expect(readCredentials()).resolves.toMatchObject({ issuedAt: '2026-11-13T00:00:00.000Z', privateKey: 'pem' })
    expect(JSON.parse(await readFile(getCredentialsPath(), 'utf8'))).toMatchObject({ token: 'token', privateKey: 'pem' })
  })
})

describe('updateCredentials', () => {
  const stored = { studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' }

  it('keeps both changes when a token refresh and a permission change overlap', async () => {
    await writeCredentials(stored)

    await Promise.all([
      updateCredentials((current) => current && { ...current, token: 'refreshed' }),
      updateCredentials((current) => current && { ...current, projects: { '/project': { allowWrite: false } } }),
    ])

    await expect(readCredentials()).resolves.toMatchObject({ token: 'refreshed', projects: { '/project': { allowWrite: false } } })
  })

  it('leaves the file alone when the update returns nothing, and releases the lock', async () => {
    await writeCredentials(stored)

    await updateCredentials(() => undefined)
    await updateCredentials((current) => current && { ...current, token: 'next' })

    await expect(readCredentials()).resolves.toMatchObject({ token: 'next' })
  })
})
