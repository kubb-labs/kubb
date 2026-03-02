import os from 'node:os'
import process from 'node:process'
import { executeIfOnline } from '@kubb/core/utils'

const TELEMETRY_ENDPOINT = 'https://telemetry.kubb.dev/api/v1/record'

export type TelemetryEvent = {
  command: string
  kubbVersion: string
  nodeVersion: string
  platform: string
  ci: boolean
  plugins: string[]
  duration: number
  filesCreated: number
  status: 'success' | 'failed'
}

/**
 * Check if telemetry is disabled via DO_NOT_TRACK or KUBB_DISABLE_TELEMETRY.
 * Respects the standard DO_NOT_TRACK convention used across development tools.
 */
export function isTelemetryDisabled(): boolean {
  return (
    process.env['DO_NOT_TRACK'] === '1' ||
    process.env['DO_NOT_TRACK'] === 'true' ||
    process.env['KUBB_DISABLE_TELEMETRY'] === '1' ||
    process.env['KUBB_DISABLE_TELEMETRY'] === 'true'
  )
}

/**
 * Send an anonymous telemetry event to the Kubb telemetry endpoint.
 * Respects DO_NOT_TRACK and KUBB_DISABLE_TELEMETRY environment variables.
 * Fails silently to never interrupt the generation process.
 */
export async function sendTelemetry(event: TelemetryEvent): Promise<void> {
  if (isTelemetryDisabled()) {
    return
  }

  await executeIfOnline(async () => {
    try {
      await fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5_000),
      })
    } catch {
      // Fail silently – telemetry must never break the CLI
    }
  })
}

/**
 * Build an anonymous telemetry payload from a completed generation run.
 * No file paths, OpenAPI specs, plugin options, or secrets are included.
 */
export function buildTelemetryEvent(options: {
  command: string
  kubbVersion: string
  plugins: string[]
  hrStart: [number, number]
  filesCreated: number
  status: 'success' | 'failed'
}): TelemetryEvent {
  const [seconds, nanoseconds] = process.hrtime(options.hrStart)
  const duration = Math.round(seconds * 1000 + nanoseconds / 1e6)

  return {
    command: options.command,
    kubbVersion: options.kubbVersion,
    nodeVersion: process.versions.node.split('.')[0] ?? 'unknown',
    platform: os.platform(),
    ci: !!(process.env['CI'] || process.env['GITHUB_ACTIONS']),
    plugins: options.plugins,
    duration,
    filesCreated: options.filesCreated,
    status: options.status,
  }
}
