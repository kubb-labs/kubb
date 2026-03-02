import { randomBytes } from 'node:crypto'
import os from 'node:os'
import process from 'node:process'
import { executeIfOnline } from '@kubb/core/utils'

const OTLP_ENDPOINT = 'https://otlp.kubb.dev/v1/traces'

export type TelemetryPlugin = {
  name: string
  options: Record<string, unknown>
}

export type TelemetryEvent = {
  command: string
  kubbVersion: string
  nodeVersion: string
  platform: string
  ci: boolean
  plugins: TelemetryPlugin[]
  duration: number
  filesCreated: number
  status: 'success' | 'failed'
}

/**
 * Detect whether the current process is running inside a CI environment by
 * checking the well-known environment variables set by all major CI systems.
 */
export function isCi(): boolean {
  return !!(
    (
      process.env['CI'] || // Generic (GitHub Actions, GitLab CI, CircleCI, Travis CI, etc.)
      process.env['GITHUB_ACTIONS'] || // GitHub Actions
      process.env['GITLAB_CI'] || // GitLab CI
      process.env['BITBUCKET_BUILD_NUMBER'] || // Bitbucket Pipelines
      process.env['JENKINS_URL'] || // Jenkins
      process.env['CIRCLECI'] || // CircleCI
      process.env['TRAVIS'] || // Travis CI
      process.env['TEAMCITY_VERSION'] || // TeamCity
      process.env['BUILDKITE'] || // Buildkite
      process.env['TF_BUILD']
    ) // Azure Pipelines
  )
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
 * Convert a TelemetryEvent into an OTLP-compatible JSON trace payload.
 * See https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/
 */
export function buildOtlpPayload(event: TelemetryEvent): unknown {
  const traceId = randomBytes(16).toString('hex')
  const spanId = randomBytes(8).toString('hex')
  const endTimeNs = BigInt(Date.now()) * 1_000_000n
  const startTimeNs = endTimeNs - BigInt(event.duration) * 1_000_000n

  const attributes = [
    { key: 'kubb.command', value: { stringValue: event.command } },
    { key: 'kubb.version', value: { stringValue: event.kubbVersion } },
    { key: 'kubb.node_version', value: { stringValue: event.nodeVersion } },
    { key: 'kubb.platform', value: { stringValue: event.platform } },
    { key: 'kubb.ci', value: { boolValue: event.ci } },
    { key: 'kubb.files_created', value: { intValue: event.filesCreated } },
    { key: 'kubb.status', value: { stringValue: event.status } },
    {
      key: 'kubb.plugins',
      value: {
        arrayValue: {
          values: event.plugins.map((p) => ({
            kvlistValue: {
              values: [
                { key: 'name', value: { stringValue: p.name } },
                { key: 'options', value: { stringValue: JSON.stringify(p.options) } },
              ],
            },
          })),
        },
      },
    },
  ]

  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'kubb-cli' } },
            { key: 'service.version', value: { stringValue: event.kubbVersion } },
            { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: 'kubb-cli', version: event.kubbVersion },
            spans: [
              {
                traceId,
                spanId,
                name: event.command,
                kind: 1,
                startTimeUnixNano: String(startTimeNs),
                endTimeUnixNano: String(endTimeNs),
                attributes,
                status: { code: event.status === 'success' ? 1 : 2 },
              },
            ],
          },
        ],
      },
    ],
  }
}

/**
 * Send an anonymous telemetry event to the Kubb OTLP endpoint.
 * Respects DO_NOT_TRACK and KUBB_DISABLE_TELEMETRY environment variables.
 * Fails silently to never interrupt the generation process.
 */
export async function sendTelemetry(event: TelemetryEvent): Promise<void> {
  if (isTelemetryDisabled()) {
    return
  }

  await executeIfOnline(async () => {
    try {
      await fetch(OTLP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildOtlpPayload(event)),
        signal: AbortSignal.timeout(5_000),
      })
    } catch {
      // Fail silently – telemetry must never break the CLI
    }
  })
}

/**
 * Build an anonymous telemetry payload from a completed generation run.
 * No file paths, OpenAPI specs, or secrets are included.
 */
export function buildTelemetryEvent(options: {
  command: string
  kubbVersion: string
  plugins: TelemetryPlugin[]
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
    ci: isCi(),
    plugins: options.plugins,
    duration,
    filesCreated: options.filesCreated,
    status: options.status,
  }
}
