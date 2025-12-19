import { canUseTTY, isCIEnvironment, isGitHubActions } from './envDetection.ts'

describe('envDetection', () => {
  describe('isGitHubActions', () => {
    it('should detect GitHub Actions environment', () => {
      const original = process.env.GITHUB_ACTIONS
      process.env.GITHUB_ACTIONS = 'true'
      expect(isGitHubActions()).toBe(true)
      if (original) {
        process.env.GITHUB_ACTIONS = original
      } else {
        delete process.env.GITHUB_ACTIONS
      }
    })

    it('should return false when not in GitHub Actions', () => {
      const original = process.env.GITHUB_ACTIONS
      delete process.env.GITHUB_ACTIONS
      expect(isGitHubActions()).toBe(false)
      if (original) {
        process.env.GITHUB_ACTIONS = original
      }
    })
  })

  describe('isCIEnvironment', () => {
    it('should detect CI environment', () => {
      const original = process.env.CI
      process.env.CI = 'true'
      expect(isCIEnvironment()).toBe(true)
      if (original) {
        process.env.CI = original
      } else {
        delete process.env.CI
      }
    })
  })

  describe('canUseTTY', () => {
    it('should check for TTY and non-CI', () => {
      const result = canUseTTY()
      expect(typeof result).toBe('boolean')
    })
  })
})
