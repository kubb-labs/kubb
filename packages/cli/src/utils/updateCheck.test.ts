import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLatestVersion, UPDATE_CHECK_INTERVAL_MS } from './updateCheck.ts'

const CI_VARIABLES = [
  'CI',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'BITBUCKET_BUILD_NUMBER',
  'JENKINS_URL',
  'CIRCLECI',
  'TRAVIS',
  'TEAMCITY_VERSION',
  'BUILDKITE',
  'TF_BUILD',
]
const NOW = new Date('2026-11-12T12:00:00Z').getTime()

let home: string
const storePath = () => join(home, 'cache', 'update-check.json')
const store = (value: unknown) => {
  mkdirSync(join(home, 'cache'), { recursive: true })
  writeFileSync(storePath(), JSON.stringify(value))
}
const mockRegistry = (version = '9.0.0') => vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ version }))

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'kubb-update-check-'))
  vi.stubEnv('KUBB_HOME', home)
  for (const name of CI_VARIABLES) vi.stubEnv(name, '')
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  rmSync(home, { recursive: true, force: true })
})

describe('getLatestVersion', () => {
  it('skips the request in CI', async () => {
    vi.stubEnv('CI', '1')
    const fetch = mockRegistry()

    expect(await getLatestVersion(new AbortController().signal)).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('still checks when CI=false opts out', async () => {
    vi.stubEnv('CI', 'false')
    const fetch = mockRegistry()

    expect(await getLatestVersion(new AbortController().signal)).toBe('9.0.0')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('answers from a fresh stored check without a request', async () => {
    store({ version: '8.1.0', checkedAt: NOW - UPDATE_CHECK_INTERVAL_MS + 1_000 })
    const fetch = mockRegistry()

    expect(await getLatestVersion(new AbortController().signal)).toBe('8.1.0')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('asks the registry again for a stale stored check and stores the new answer', async () => {
    store({ version: '8.1.0', checkedAt: NOW - UPDATE_CHECK_INTERVAL_MS })
    const fetch = mockRegistry('9.0.0')

    expect(await getLatestVersion(new AbortController().signal)).toBe('9.0.0')
    expect(fetch).toHaveBeenCalledOnce()
    expect(JSON.parse(readFileSync(storePath(), 'utf8'))).toStrictEqual({ version: '9.0.0', checkedAt: NOW })
  })

  it('asks the registry again when the stored check is in the future', async () => {
    store({ version: '8.1.0', checkedAt: NOW + 60_000 })
    const fetch = mockRegistry('9.0.0')

    expect(await getLatestVersion(new AbortController().signal)).toBe('9.0.0')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('stores nothing when the registry does not answer', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

    expect(await getLatestVersion(new AbortController().signal)).toBeUndefined()
    expect(() => readFileSync(storePath())).toThrow()
  })

  it('asks the registry again when the stored version is not valid semver', async () => {
    store({ version: 'not-a-version', checkedAt: NOW })
    const fetch = mockRegistry('9.0.0')

    expect(await getLatestVersion(new AbortController().signal)).toBe('9.0.0')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('ignores a registry version that is not valid semver', async () => {
    const fetch = mockRegistry('latest')

    expect(await getLatestVersion(new AbortController().signal)).toBeUndefined()
    expect(fetch).toHaveBeenCalledOnce()
    expect(() => readFileSync(storePath())).toThrow()
  })

  it('ignores an error answer from the registry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Not found' }, { status: 404 }))

    expect(await getLatestVersion(new AbortController().signal)).toBeUndefined()
  })

  it('falls back to the registry when the store cannot be read or written', async () => {
    // A folder where the file should be makes both the read and the write fail.
    mkdirSync(storePath(), { recursive: true })
    const fetch = mockRegistry('9.0.0')

    expect(await getLatestVersion(new AbortController().signal)).toBe('9.0.0')
    expect(fetch).toHaveBeenCalledOnce()
  })
})
