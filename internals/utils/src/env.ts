/**
 * Returns `true` when running inside a GitHub Actions workflow.
 */
export function isGitHubActions(): boolean {
  return !!process.env.GITHUB_ACTIONS
}

/**
 * Returns `true` when the process is running in a CI environment.
 * Covers GitHub Actions, GitLab CI, CircleCI, Travis CI, Jenkins, Bitbucket,
 * TeamCity, Buildkite, and Azure Pipelines.
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.JENKINS_URL ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.TEAMCITY_VERSION ||
    process.env.BUILDKITE ||
    process.env.TF_BUILD
  )
}

/**
 * Returns `true` when the process has an interactive TTY and is not running in CI.
 */
export function canUseTTY(): boolean {
  return !!process.stdout.isTTY && !isCIEnvironment()
}
