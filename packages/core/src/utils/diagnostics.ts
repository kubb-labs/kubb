import { version as nodeVersion } from 'node:process'

/**
 * Get diagnostic information for debugging
 */
export function getDiagnosticInfo(): Record<string, string> {
  return {
    nodeVersion,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    // Note: Kubb version tracking would require reading package.json at runtime
    // which adds I/O overhead. Consider adding this in a future version if needed.
  }
}

/**
 * Format diagnostic information as a string for logs with improved readability
 */
export function formatDiagnosticInfo(): string {
  const info = getDiagnosticInfo()
  return Object.entries(info)
    .map(([key, value]) => `  • ${key}: ${value}`)
    .join('\n')
}
