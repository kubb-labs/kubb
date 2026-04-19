import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canUseTTY, isCIEnvironment, isGitHubActions } from './env.ts'

const originalIsTTY = process.stdout.isTTY
const originalColumns = process.stdout.columns

afterEach(() => {
  vi.unstubAllEnvs()
  Object.defineProperty(process.stdout, 'isTTY', {
    value: originalIsTTY,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(process.stdout, 'columns', {
    value: originalColumns,
    writable: true,
    configurable: true,
  })
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
    {
      isTTY: true,
      columns: 80,
      ci: '',
      expected: true,
      label: 'isTTY with valid columns and no CI',
    },
    { isTTY: false, columns: 80, ci: '', expected: false, label: 'no isTTY' },
    {
      isTTY: true,
      columns: 80,
      ci: 'true',
      expected: false,
      label: 'isTTY but in CI',
    },
    {
      isTTY: true,
      columns: 0,
      ci: '',
      expected: false,
      label: 'isTTY but columns is 0 (broken IDE terminal)',
    },
    {
      isTTY: true,
      columns: undefined,
      ci: '',
      expected: false,
      label: 'isTTY but columns is undefined',
    },
  ])('returns $expected when $label', ({ isTTY, columns, ci, expected }) => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: isTTY,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(process.stdout, 'columns', {
      value: columns,
      writable: true,
      configurable: true,
    })
    vi.stubEnv('CI', ci)
    expect(canUseTTY()).toBe(expected)
  })
})
