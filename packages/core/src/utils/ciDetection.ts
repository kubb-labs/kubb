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
export const GITHUB_ACTIONS_GROUP_START = '::group::'
export const GITHUB_ACTIONS_GROUP_END = '::endgroup::'

/**
 * Create a collapsible group marker for GitHub Actions logs
 * @param title - The title of the group
 * @returns The opening marker for the group (only in GitHub Actions, otherwise empty string)
 */
export function startGroup(title: string): string {
  if (isGitHubActions()) {
    return `${GITHUB_ACTIONS_GROUP_START}${title}`
  }
  return ''
}

/**
 * End a collapsible group in GitHub Actions logs
 * @returns The closing marker for the group (only in GitHub Actions, otherwise empty string)
 */
export function endGroup(): string {
  if (isGitHubActions()) {
    return GITHUB_ACTIONS_GROUP_END
  }
  return ''
}

/**
 * Format a log message for CI environments with optional grouping
 * @param message - The log message to format
 * @param options - Optional configuration for grouping
 * @returns The formatted message with CI markers if applicable
 */
export function formatCILog(message: string, options?: { group?: boolean; title?: string }): string {
  if (options?.group && options?.title && isGitHubActions()) {
    return `${startGroup(options.title)}\n${message}\n${endGroup()}`
  }
  return message
}
