import { x } from 'tinyexec'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { openInBrowser } from './openInBrowser.ts'

vi.mock('tinyexec', () => ({ x: vi.fn(() => Promise.resolve()) }))

afterEach(() => vi.unstubAllEnvs())

describe('openInBrowser', () => {
  it('does not open a browser in CI', () => {
    vi.stubEnv('CI', 'true')

    openInBrowser('https://kubb.dev')

    expect(x).not.toHaveBeenCalled()
  })

  it('opens the URL with the platform browser command', () => {
    for (const key of [
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
    ]) {
      vi.stubEnv(key, '')
    }

    openInBrowser('https://kubb.dev')

    expect(x).toHaveBeenCalledWith(
      process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open',
      process.platform === 'win32' ? ['/c', 'start', '', 'https://kubb.dev'] : ['https://kubb.dev'],
    )
  })
})
