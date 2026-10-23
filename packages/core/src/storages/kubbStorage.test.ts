import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { kubbStorage, resolveKubbDir } from './kubbStorage.ts'

let home: string

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'kubb-home-'))
  vi.stubEnv('KUBB_HOME', home)
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

describe('resolveKubbDir', () => {
  it('resolves a relative base inside KUBB_HOME', () => {
    expect(resolveKubbDir('cache')).toBe(join(home, 'cache'))
  })

  it('uses an absolute base as is', () => {
    expect(resolveKubbDir(join(home, 'project', '.kubb'))).toBe(join(home, 'project', '.kubb'))
  })

  it.skipIf(process.platform === 'win32')('creates the folder with mode 0700 and tightens an existing one', () => {
    chmodSync(home, 0o755)

    expect(statSync(resolveKubbDir('cache')).mode & 0o777).toBe(0o700)
    expect(statSync(resolveKubbDir()).mode & 0o777).toBe(0o700)
  })

  it('falls back to the OS temp directory when the base cannot be created', () => {
    const file = join(home, 'file')
    writeFileSync(file, '')

    const dir = resolveKubbDir(join(file, 'cache'))

    expect(dir.startsWith(join(tmpdir(), 'kubb'))).toBe(true)
    expect(statSync(dir).isDirectory()).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('kubbStorage', () => {
  it('writes keys as files inside the folder', async () => {
    const storage = kubbStorage({ base: 'cache' })

    await storage.setItem('machine-secret', 'secret')
    await storage.setItem('reports/data.js', 'data')

    expect(readFileSync(join(home, 'cache', 'machine-secret'), 'utf8')).toBe('secret')
    expect(readFileSync(join(home, 'cache', 'reports', 'data.js'), 'utf8')).toBe('data')
    expect(await storage.getItem('machine-secret')).toBe('secret')
  })

  it('reads and writes files in the format unstorage used', async () => {
    const storage = kubbStorage({ base: 'project' })
    writeFileSync(join(home, 'project', 'credentials.json'), '{"studioUrl":"https://studio.kubb.dev","token":"t"}')
    writeFileSync(join(home, 'project', 'machine-secret'), 'abc123')

    expect(await storage.getItem('credentials.json')).toEqual({ studioUrl: 'https://studio.kubb.dev', token: 't' })
    expect(await storage.getItem('machine-secret')).toBe('abc123')

    await storage.setItem('credentials.json', { studioUrl: 'https://studio.kubb.dev', token: 't' })
    expect(readFileSync(join(home, 'project', 'credentials.json'), 'utf8')).toBe('{"studioUrl":"https://studio.kubb.dev","token":"t"}')
  })

  it('returns null for a missing key and removes keys', async () => {
    const storage = kubbStorage({ base: 'cache' })

    expect(await storage.getItem('missing')).toBeNull()
    await storage.setItem('machine-secret', 'secret')
    await storage.removeItem('machine-secret')
    await storage.removeItem('machine-secret')

    expect(await storage.getItem('machine-secret')).toBeNull()
  })
})
