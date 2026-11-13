import { mkdir, mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const keychain = vi.hoisted(() => ({ items: new Map<string, string>(), available: true, pending: undefined as Promise<string | null> | undefined }))

vi.mock('@napi-rs/keyring', () => ({
  AsyncEntry: class {
    constructor(
      readonly service: string,
      readonly account: string,
    ) {}
    async setPassword(password: string) {
      if (!keychain.available) throw new Error("Couldn't access platform storage: AccessDenied")
      keychain.items.set(this.account, password)
    }
    async getPassword() {
      if (!keychain.available) throw new Error("Couldn't access platform storage: AccessDenied")
      if (keychain.pending) return keychain.pending
      return keychain.items.get(this.account) ?? null
    }
    async deletePassword() {
      return keychain.items.delete(this.account)
    }
  },
}))

import { clearCredentials, getCredentialsPath, getMachineId, getProjectKubbHome, readCredentials, updateCredentials, writeCredentials } from './credentials.ts'

let home: string

beforeEach(async () => {
  home = await mkdtemp(path.join(tmpdir(), 'kubb-home-'))
  keychain.items.clear()
  keychain.available = true
  keychain.pending = undefined
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

describe('clearCredentials', () => {
  it('keeps a credential stored since under another token, and forgets the one it was given', async () => {
    const stored = { studioUrl: 'https://kubb.studio', token: 'new-token', agentId: '1', agentSlug: 'brave-otter' }
    await writeCredentials(stored)

    await clearCredentials('rejected-token')
    await expect(readCredentials()).resolves.toMatchObject({ token: 'new-token' })

    await clearCredentials('new-token')
    await expect(readCredentials()).resolves.toBeNull()
  })
})

describe('readCredentials', () => {
  const released = { studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' }

  it('reads credentials written before token refresh and agent keys', async () => {
    await writeCredentials(released)

    await expect(readCredentials()).resolves.toStrictEqual(released)
  })

  it('keeps the agent key in the keychain and out of the credential file, and forgets it on clear', async () => {
    await writeCredentials({ ...released, privateKey: 'pem' })

    expect(JSON.parse(await readFile(getCredentialsPath(), 'utf8'))).not.toHaveProperty('privateKey')
    await expect(readCredentials()).resolves.toMatchObject({ privateKey: 'pem' })

    await clearCredentials()
    expect(keychain.items.size).toBe(0)
  })

  it('keeps the agent key in the credential file when the keychain refuses it', async () => {
    keychain.available = false
    await writeCredentials({ ...released, privateKey: 'pem' })

    expect(JSON.parse(await readFile(getCredentialsPath(), 'utf8'))).toMatchObject({ privateKey: 'pem' })
    await expect(readCredentials()).resolves.toMatchObject({ privateKey: 'pem' })
  })
})

describe('updateCredentials', () => {
  it('drops its write and leaves the lock alone after another process took the lock over', async () => {
    let answer = (_key: string | null) => {}
    keychain.pending = new Promise<string | null>((resolve) => (answer = resolve))
    await writeCredentials(stored)
    const lock = path.join(getProjectKubbHome(), 'credentials.lock')

    const paused = updateCredentials((current) => current && { ...current, token: 'stale' })
    await vi.waitFor(async () => expect(await readFile(path.join(lock, 'owner'), 'utf8')).toBeTruthy())
    // What a second process does once the first one's lock looks abandoned.
    await rm(lock, { recursive: true })
    await mkdir(lock)
    await writeFile(path.join(lock, 'owner'), 'other-process')

    answer(null)
    await expect(paused).rejects.toThrow(/took over/)
    await expect(readCredentials()).resolves.toMatchObject({ token: 'token' })
    await expect(readFile(path.join(lock, 'owner'), 'utf8')).resolves.toBe('other-process')
  })

  it('keeps its lock fresh while a slow keychain call holds it past the stale age', async () => {
    let answer = (_key: string | null) => {}
    keychain.pending = new Promise<string | null>((resolve) => (answer = resolve))
    await writeCredentials({ studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' })
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    const lock = path.join(getProjectKubbHome(), 'credentials.lock')

    const update = updateCredentials((current) => current)
    await vi.waitFor(async () => expect(await stat(lock)).toBeDefined())
    vi.advanceTimersByTime(11_000)
    await vi.waitFor(async () => expect(Date.now() - (await stat(lock)).mtimeMs).toBeLessThan(10_000))

    answer(null)
    await update
    vi.useRealTimers()
  })

  const stored = { studioUrl: 'https://kubb.studio', token: 'token', agentId: '1', agentSlug: 'brave-otter' }

  it('keeps both changes when a token refresh and a permission change overlap', async () => {
    await writeCredentials(stored)

    await Promise.all([
      updateCredentials((current) => current && { ...current, token: 'refreshed' }),
      updateCredentials((current) => current && { ...current, projects: { '/project': { allowWrite: false } } }),
    ])

    await expect(readCredentials()).resolves.toMatchObject({ token: 'refreshed', projects: { '/project': { allowWrite: false } } })
  })

  it('lets two writers take over a lock left by a process that died, one after the other', async () => {
    await writeCredentials(stored)
    const lock = path.join(getProjectKubbHome(), 'credentials.lock')
    await mkdir(lock)
    const longAgo = new Date(Date.now() - 60_000)
    await utimes(lock, longAgo, longAgo)

    await Promise.all([
      updateCredentials((current) => current && { ...current, token: 'refreshed' }),
      updateCredentials((current) => current && { ...current, projects: { '/project': { allowWrite: false } } }),
    ])

    await expect(readCredentials()).resolves.toMatchObject({ token: 'refreshed', projects: { '/project': { allowWrite: false } } })
  })
})
