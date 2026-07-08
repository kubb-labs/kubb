import { randomBytes } from 'node:crypto'
import os from 'node:os'
import process from 'node:process'
import { isCIEnvironment, runtime } from '@internals/utils'
import { OTLP_ENDPOINT } from './constants.ts'

type OtlpKeyValue = {
  key: string
  value:
    | { stringValue: string }
    | { boolValue: boolean }
    | { intValue: number }
    | { arrayValue: { values: Array<{ kvlistValue: { values: Array<OtlpKeyValue> } }> } }
    | { kvlistValue: { values: Array<OtlpKeyValue> } }
}

type OtlpSpan = {
  traceId: string
  spanId: string
  name: string
  kind: 1
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes: Array<OtlpKeyValue>
  status: { code: 1 | 2 }
}

type OtlpExportTraceServiceRequest = {
  resourceSpans: Array<{
    resource: { attributes: Array<OtlpKeyValue> }
    scopeSpans: Array<{
      scope: { name: string; version: string }
      spans: Array<OtlpSpan>
    }>
  }>
}

/**
 * Anonymous plugin name and options snapshot sent with each telemetry event.
 */
export type TelemetryPlugin = {
  /**
   * Plugin name as registered in the Kubb config, e.g. `'@kubb/plugin-ts'`.
   */
  name: string
  /**
   * Anonymized snapshot of the plugin options. Values are included but cannot be traced back to a user.
   */
  options: Record<string, unknown>
}

/**
 * Anonymous snapshot of a single Kubb run, built by {@link buildTelemetryEvent} and sent by {@link sendTelemetry}.
 */
export type TelemetryEvent = {
  command: string
  kubbVersion: string
  /**
   * Major version of Node that executed the run, e.g. `'22'`.
   */
  nodeVersion: string
  /**
   * Name of the JavaScript runtime that executed the run, `'bun'`, `'deno'`, or `'node'`.
   */
  runtime: string
  /**
   * Major version of the active runtime, e.g. `'1'` under Bun or `'22'` under Node.
   */
  runtimeVersion: string
  platform: string
  ci: boolean
  plugins: Array<TelemetryPlugin>
  duration: number
  filesCreated: number
  status: 'success' | 'failed'
}

/**
 * Returns `true` when telemetry is disabled via `DO_NOT_TRACK` or `KUBB_DISABLE_TELEMETRY`.
 */
export function isDisabled(): boolean {
  return (
    process.env['DO_NOT_TRACK'] === '1' ||
    process.env['DO_NOT_TRACK'] === 'true' ||
    process.env['KUBB_DISABLE_TELEMETRY'] === '1' ||
    process.env['KUBB_DISABLE_TELEMETRY'] === 'true'
  )
}

/**
 * Build an anonymous telemetry payload from a completed generation run.
 */
export function buildTelemetryEvent(options: {
  command: 'generate' | 'mcp' | 'validate' | 'agent'
  kubbVersion: string
  plugins?: Array<TelemetryPlugin>
  hrStart: [number, number]
  filesCreated?: number
  status: 'success' | 'failed'
}): TelemetryEvent {
  const [seconds, nanoseconds] = process.hrtime(options.hrStart)
  const duration = Math.round(seconds * 1000 + nanoseconds / 1e6)

  return {
    command: options.command,
    kubbVersion: options.kubbVersion,
    nodeVersion: process.versions.node.split('.')[0] as string,
    runtime: runtime.name,
    runtimeVersion: runtime.version.split('.')[0] as string,
    platform: os.platform(),
    ci: isCIEnvironment(),
    plugins: options.plugins ?? [],
    duration,
    filesCreated: options.filesCreated ?? 0,
    status: options.status,
  }
}

/**
 * Convert a {@link TelemetryEvent} into an OTLP-compatible JSON trace payload.
 *
 * @see https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/
 */
export function buildOtlpPayload(event: TelemetryEvent): OtlpExportTraceServiceRequest {
  const traceId = randomBytes(16).toString('hex')
  const spanId = randomBytes(8).toString('hex')
  const endTimeNs = BigInt(Date.now()) * 1_000_000n
  const startTimeNs = endTimeNs - BigInt(event.duration) * 1_000_000n

  const attributes: Array<OtlpKeyValue> = [
    { key: 'kubb.command', value: { stringValue: event.command } },
    { key: 'kubb.version', value: { stringValue: event.kubbVersion } },
    { key: 'kubb.node_version', value: { stringValue: event.nodeVersion } },
    { key: 'kubb.runtime', value: { stringValue: event.runtime } },
    { key: 'kubb.runtime_version', value: { stringValue: event.runtimeVersion } },
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
                {
                  key: 'options',
                  value: {
                    stringValue: JSON.stringify({
                      ...p.options,
                      usedEnumNames: undefined,
                    }),
                  },
                },
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
            { key: 'service.name', value: { stringValue: 'kubb-core' } },
            {
              key: 'service.version',
              value: { stringValue: event.kubbVersion },
            },
            { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: 'kubb-core', version: event.kubbVersion },
            spans: [
              {
                traceId,
                spanId,
                name: event.command,
                kind: 1,
                startTimeUnixNano: String(startTimeNs),
                endTimeUnixNano: String(endTimeNs),
                attributes,
                status: {
                  code: event.status === 'success' ? 1 : 2,
                },
              },
            ],
          },
        ],
      },
    ],
  }
}

/**
 * Send an anonymous telemetry event to the Kubb OTLP endpoint. Respects `DO_NOT_TRACK` and
 * `KUBB_DISABLE_TELEMETRY`, and fails silently so telemetry never interrupts a run. No file
 * paths, OpenAPI specs, or secrets are sent.
 */
export async function sendTelemetry(event: TelemetryEvent): Promise<void> {
  if (isDisabled()) {
    return
  }

  try {
    await fetch(`${OTLP_ENDPOINT}/v1/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Kubb-Telemetry-Version': '1',
        'Kubb-Telemetry-Source': 'kubb-core',
      },
      body: JSON.stringify(buildOtlpPayload(event)),
      signal: AbortSignal.timeout(5_000),
    })
  } catch (_e) {
    // Fail silently, telemetry must never break the run
  }
}
