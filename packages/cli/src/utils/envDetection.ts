/**
 * Check if running in GitHub Actions environment
 */
export function isGitHubActions(): boolean {
  return !!process.env.GITHUB_ACTIONS
}

/**
 * Check if running in any CI environment.
 * Covers all major CI systems via their well-known environment variables.
 */
export function isCIEnvironment(): boolean {
  return !!(
    (
      process.env.CI || // Generic (GitHub Actions, GitLab CI, CircleCI, Travis CI, etc.)
      process.env.GITHUB_ACTIONS || // GitHub Actions
      process.env.GITLAB_CI || // GitLab CI
      process.env.BITBUCKET_BUILD_NUMBER || // Bitbucket Pipelines
      process.env.JENKINS_URL || // Jenkins
      process.env.CIRCLECI || // CircleCI
      process.env.TRAVIS || // Travis CI
      process.env.TEAMCITY_VERSION || // TeamCity
      process.env.BUILDKITE || // Buildkite
      process.env.TF_BUILD
    ) // Azure Pipelines
  )
}

/**
 * Check if TTY is available for interactive output
 */
export function canUseTTY(): boolean {
  return !!process.stdout.isTTY && !isCIEnvironment()
}
