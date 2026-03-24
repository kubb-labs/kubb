/**
 * Returns `true` when running inside a GitHub Actions workflow.
 *
 * @example
 * ```ts
 * if (isGitHubActions()) {
 *   core.setOutput('result', 'ok')
 * }
 * ```
 */
export function isGitHubActions(): boolean {
  return !!process.env.GITHUB_ACTIONS
}

/**
 * Returns `true` when the process is running in a CI environment.
 * Covers GitHub Actions, GitLab CI, CircleCI, Travis CI, Jenkins, Bitbucket,
 * TeamCity, Buildkite, and Azure Pipelines.
 *
 * @example
 * ```ts
 * if (isCIEnvironment()) {
 *   logger.level = 'error'
 * }
 * ```
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
 * Returns `true` when the process has an interactive TTY with a valid terminal
 * width and is not running in CI.
 *
 * Some IDE-embedded terminals report `isTTY = true` but set `columns` to `0`,
 * which breaks clack's box-drawing helpers (they call `String.prototype.repeat`
 * with a negative count and throw a `RangeError`).  We therefore require a
 * positive column count before declaring the TTY usable.
 *
 * @example
 * ```ts
 * if (canUseTTY()) {
 *   renderProgressBar()
 * }
 * ```
 */
export function canUseTTY(): boolean {
  return !!process.stdout.isTTY && (process.stdout.columns ?? 0) > 0 && !isCIEnvironment()
}
