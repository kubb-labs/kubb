/**
 * Detect if running in a CI environment
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.RUN_ID
  )
}

/**
 * Detect if running in GitHub Actions
 */
export function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true'
}

/**
 * Create a collapsible group in GitHub Actions logs
 * @param title - The title of the group
 * @returns The opening marker for the group
 */
export function startGroup(title: string): string {
  if (isGitHubActions()) {
    return `::group::${title}`
  }
  return title
}

/**
 * End a collapsible group in GitHub Actions logs
 * @returns The closing marker for the group
 */
export function endGroup(): string {
  if (isGitHubActions()) {
    return '::endgroup::'
  }
  return ''
}

/**
 * Format a log message for CI environments with optional grouping
 */
export function formatCILog(message: string, options?: { group?: boolean; title?: string }): string {
  if (options?.group && options?.title && isGitHubActions()) {
    return `${startGroup(options.title)}\n${message}\n${endGroup()}`
  }
  return message
}
