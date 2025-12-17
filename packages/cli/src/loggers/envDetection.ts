/**
 * Check if running in GitHub Actions environment
 */
export function isGitHubActions(): boolean {
  return !!process.env.GITHUB_ACTIONS
}

/**
 * Check if running in any CI environment
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.JENKINS_URL ||
    process.env.BUILDKITE
  )
}

/**
 * Check if TTY is available for interactive output
 */
export function canUseTTY(): boolean {
  return !!process.stdout.isTTY && !isCIEnvironment()
}
