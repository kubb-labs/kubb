import { randomBytes } from 'node:crypto'
import os from 'node:os'
import process from 'node:process'
import { executeIfOnline } from '@kubb/core/utils'
import { OTLP_ENDPOINT } from '../constants.ts'
import { isCIEnvironment } from './envDetection.ts'

// ---------------------------------------------------------------------------
// OpenTelemetry OTLP JSON types
// https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/trace/v1/trace.proto
// https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/common/v1/common.proto
// ---------------------------------------------------------------------------

type OtlpStringValue = { stringValue: string }
type OtlpBoolValue = { boolValue: boolean }
type OtlpIntValue = { intValue: number }
type OtlpDoubleValue = { doubleValue: number }
type OtlpBytesValue = { bytesValue: string }
type OtlpArrayValue = { arrayValue: { values: OtlpAnyValue[] } }
type OtlpKvListValue = { kvlistValue: { values: OtlpKeyValue[] } }

type OtlpAnyValue = OtlpStringValue | OtlpBoolValue | OtlpIntValue | OtlpDoubleValue | OtlpBytesValue | OtlpArrayValue | OtlpKvListValue

type OtlpKeyValue = {
  key: string
  value: OtlpAnyValue
}

type OtlpResource = {
  attributes: OtlpKeyValue[]
  droppedAttributesCount?: number
}

type OtlpInstrumentationScope = {
  name: string
  version?: string
  attributes?: OtlpKeyValue[]
  droppedAttributesCount?: number
}

/** https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/trace/v1/trace.proto#L103 */
type OtlpSpanKind = 0 | 1 | 2 | 3 | 4 | 5

/** 0 = STATUS_CODE_UNSET, 1 = STATUS_CODE_OK, 2 = STATUS_CODE_ERROR */
type OtlpStatusCode = 0 | 1 | 2

type OtlpStatus = {
  code: OtlpStatusCode
  message?: string
}

type OtlpSpan = {
  traceId: string
  spanId: string
  traceState?: string
  parentSpanId?: string
  name: string
  kind: OtlpSpanKind
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes?: OtlpKeyValue[]
  droppedAttributesCount?: number
  events?: OtlpSpanEvent[]
  droppedEventsCount?: number
  links?: OtlpSpanLink[]
  droppedLinksCount?: number
  status?: OtlpStatus
}

type OtlpSpanEvent = {
  timeUnixNano: string
  name: string
  attributes?: OtlpKeyValue[]
  droppedAttributesCount?: number
}

type OtlpSpanLink = {
  traceId: string
  spanId: string
  traceState?: string
  attributes?: OtlpKeyValue[]
  droppedAttributesCount?: number
}

type OtlpScopeSpans = {
  scope: OtlpInstrumentationScope
  spans: OtlpSpan[]
  schemaUrl?: string
}

type OtlpResourceSpans = {
  resource: OtlpResource
  scopeSpans: OtlpScopeSpans[]
  schemaUrl?: string
}

/** Root payload sent to POST /v1/traces */
type OtlpExportTraceServiceRequest = {
  resourceSpans: OtlpResourceSpans[]
}

// ---------------------------------------------------------------------------

export type TelemetryPlugin = {
  name: string
  options: Record<string, unknown>
}

type TelemetryEvent = {
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
 * Detect whether the current process is running inside a CI environment.
 * Delegates to the canonical isCIEnvironment() from envDetection.
 */
export function isCi(): boolean {
  return isCIEnvironment()
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
export function buildOtlpPayload(event: TelemetryEvent): OtlpExportTraceServiceRequest {
  const traceId = randomBytes(16).toString('hex')
  const spanId = randomBytes(8).toString('hex')
  const endTimeNs = BigInt(Date.now()) * 1_000_000n
  const startTimeNs = endTimeNs - BigInt(event.duration) * 1_000_000n

  const attributes: OtlpKeyValue[] = [
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
          values: event.plugins.map(
            (p): OtlpKvListValue => ({
              kvlistValue: {
                values: [
                  { key: 'name', value: { stringValue: p.name } },
                  { key: 'options', value: { stringValue: JSON.stringify({ ...p.options, usedEnumNames: undefined }) } },
                ],
              },
            }),
          ),
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
                kind: 1 satisfies OtlpSpanKind,
                startTimeUnixNano: String(startTimeNs),
                endTimeUnixNano: String(endTimeNs),
                attributes,
                status: { code: (event.status === 'success' ? 1 : 2) satisfies OtlpStatusCode },
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
      await fetch(`${OTLP_ENDPOINT}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Kubb-Telemetry-Version': '1',
          'Kubb-Telemetry-Source': 'kubb-cli',
        },
        body: JSON.stringify(buildOtlpPayload(event)),
        signal: AbortSignal.timeout(5_000),
      })
    } catch (_e) {
      // Fail silently – telemetry must never break the CLI
    }
  })
}

/**
 * Build an anonymous telemetry payload from a completed generation run.
 * No file paths, OpenAPI specs, or secrets are included.
 */
export function buildTelemetryEvent(options: {
  command: 'generate' | 'mcp' | 'validate' | 'agent'
  kubbVersion: string
  plugins?: TelemetryPlugin[]
  hrStart: [number, number]
  filesCreated?: number
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
    plugins: options.plugins ?? [],
    duration,
    filesCreated: options.filesCreated ?? 0,
    status: options.status,
  }
}
