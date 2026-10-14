import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isCIEnvironment } from './isCIEnvironment.ts'

const providers = [
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

describe('isCIEnvironment', () => {
  beforeEach(() => {
    for (const key of providers) {
      vi.stubEnv(key, '')
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns true when a provider variable is set', () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true')

    expect(isCIEnvironment()).toBe(true)
  })

  it('returns false when no CI env var is set', () => {
    expect(isCIEnvironment()).toBe(false)
  })

  it.each(['false', '0'])('returns false when CI is %s', (value) => {
    vi.stubEnv('CI', value)

    expect(isCIEnvironment()).toBe(false)
  })
})
