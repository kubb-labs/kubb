import { version as nodeVersion } from 'node:process'
import { version as KubbVersion } from '../../package.json'

/**
 * Get diagnostic information for debugging
 */
export function getDiagnosticInfo() {
  return {
    nodeVersion,
    KubbVersion,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
  } as const
}
