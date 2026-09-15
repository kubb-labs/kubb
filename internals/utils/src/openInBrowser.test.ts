import { execFile } from 'node:child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { openInBrowser } from './openInBrowser.ts'

vi.mock('node:child_process', () => ({ execFile: vi.fn() }))

afterEach(() => vi.unstubAllEnvs())

describe('openInBrowser', () => {
  it('does not open a browser in CI', () => {
    vi.stubEnv('CI', 'true')

    openInBrowser('https://kubb.dev')

    expect(execFile).not.toHaveBeenCalled()
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

    expect(execFile).toHaveBeenCalledWith(
      process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open',
      process.platform === 'win32' ? ['/c', 'start', '', 'https://kubb.dev'] : ['https://kubb.dev'],
      expect.any(Function),
    )
  })
})
