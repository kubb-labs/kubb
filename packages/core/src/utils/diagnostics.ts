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
    kubbVersion: process.env.npm_package_version || 'unknown',
  }
}

/**
 * Format diagnostic information as a string for logs
 */
export function formatDiagnosticInfo(): string {
  const info = getDiagnosticInfo()
  return Object.entries(info)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}
