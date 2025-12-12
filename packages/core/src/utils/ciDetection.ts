/**
 * Detect if running in a CI environment
 * Note: Currently exported for potential future use in plugins or extensions
 */
export function isCI(): boolean {
  return !!(process.env.CI || process.env.CONTINUOUS_INTEGRATION || process.env.BUILD_NUMBER || process.env.RUN_ID)
}

/**
 * Detect if running in GitHub Actions
 */
export function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true'
}

/**
 * GitHub Actions group markers
 */
const GITHUB_ACTIONS_GROUP_START = '::group::'
const GITHUB_ACTIONS_GROUP_END = '::endgroup::'

/**
 * Create a collapsible group marker for GitHub Actions logs
 */
export function startGroup(title: string): string {
  if (isCI() && isGitHubActions()) {
    return `${GITHUB_ACTIONS_GROUP_START}${title}`
  }
  return ''
}

/**
 * End a collapsible group in GitHub Actions logs
 */
export function endGroup(): string {
  if (isGitHubActions()) {
    return GITHUB_ACTIONS_GROUP_END
  }
  return ''
}
