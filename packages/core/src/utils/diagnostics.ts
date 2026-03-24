import { version as nodeVersion } from 'node:process'
import { version as KubbVersion } from '../../package.json'

/**
 * Returns a snapshot of the current runtime environment.
 *
 * Useful for attaching context to debug logs and error reports so that
 * issues can be reproduced without manual information gathering.
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
