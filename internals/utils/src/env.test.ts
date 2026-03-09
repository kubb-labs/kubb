import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canUseTTY, isCIEnvironment, isGitHubActions } from './env.ts'

const originalIsTTY = process.stdout.isTTY

afterEach(() => {
  vi.unstubAllEnvs()
  Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true, configurable: true })
})

describe('isGitHubActions', () => {
  it.each([
    { value: 'true', expected: true },
    { value: '', expected: false },
  ])('returns $expected when GITHUB_ACTIONS="$value"', ({ value, expected }) => {
    vi.stubEnv('GITHUB_ACTIONS', value)
    expect(isGitHubActions()).toBe(expected)
  })
})

describe('isCIEnvironment', () => {
  beforeEach(() => {
    for (const key of ['CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'CIRCLECI', 'TRAVIS']) {
      vi.stubEnv(key, '')
    }
  })

  it.each(['CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'CIRCLECI', 'TRAVIS'])('returns true when %s is set', (envVar) => {
    vi.stubEnv(envVar, 'true')
    expect(isCIEnvironment()).toBe(true)
  })

  it('returns false when no CI env vars are set', () => {
    expect(isCIEnvironment()).toBe(false)
  })
})

describe('canUseTTY', () => {
  beforeEach(() => {
    vi.stubEnv('CI', '')
    vi.stubEnv('GITHUB_ACTIONS', '')
  })

  it.each([
    { isTTY: true, ci: '', expected: true, label: 'isTTY and no CI' },
    { isTTY: false, ci: '', expected: false, label: 'no isTTY' },
    { isTTY: true, ci: 'true', expected: false, label: 'isTTY but in CI' },
  ])('returns $expected when $label', ({ isTTY, ci, expected }) => {
    Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, writable: true, configurable: true })
    vi.stubEnv('CI', ci)
    expect(canUseTTY()).toBe(expected)
  })
})
