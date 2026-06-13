import { randomBytes } from 'node:crypto'
import os from 'node:os'
import process from 'node:process'
import { getRuntimeName, getRuntimeVersion, isCIEnvironment, type RuntimeName } from '@internals/utils'
import { OTLP_ENDPOINT } from './constants.ts'

// OpenTelemetry OTLP JSON types
// https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/trace/v1/trace.proto
// https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/common/v1/common.proto

type OtlpStringValue = { stringValue: string }
type OtlpBoolValue = { boolValue: boolean }
type OtlpIntValue = { intValue: number }
type OtlpDoubleValue = { doubleValue: number }
type OtlpBytesValue = { bytesValue: string }
type OtlpArrayValue = { arrayValue: { values: Array<OtlpAnyValue> } }
type OtlpKvListValue = { kvlistValue: { values: Array<OtlpKeyValue> } }

type OtlpAnyValue = OtlpStringValue | OtlpBoolValue | OtlpIntValue | OtlpDoubleValue | OtlpBytesValue | OtlpArrayValue | OtlpKvListValue

type OtlpKeyValue = {
  key: string
  value: OtlpAnyValue
}

type OtlpResource = {
  attributes: Array<OtlpKeyValue>
  droppedAttributesCount?: number
}

type OtlpInstrumentationScope = {
  name: string
  version?: string
  attributes?: Array<OtlpKeyValue>
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
  attributes?: Array<OtlpKeyValue>
  droppedAttributesCount?: number
  events?: Array<OtlpSpanEvent>
  droppedEventsCount?: number
  links?: Array<OtlpSpanLink>
  droppedLinksCount?: number
  status?: OtlpStatus
}

type OtlpSpanEvent = {
  timeUnixNano: string
  name: string
  attributes?: Array<OtlpKeyValue>
  droppedAttributesCount?: number
}

type OtlpSpanLink = {
  traceId: string
  spanId: string
  traceState?: string
  attributes?: Array<OtlpKeyValue>
  droppedAttributesCount?: number
}

type OtlpScopeSpans = {
  scope: OtlpInstrumentationScope
  spans: Array<OtlpSpan>
  schemaUrl?: string
}

type OtlpResourceSpans = {
  resource: OtlpResource
  scopeSpans: Array<OtlpScopeSpans>
  schemaUrl?: string
}

/** Root payload sent to POST /v1/traces */
type OtlpExportTraceServiceRequest = {
  resourceSpans: Array<OtlpResourceSpans>
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
   * anonymized plugin options snapshot, values are included but cannot be traced back to the user.
   */
  options: Record<string, unknown>
}

export type TelemetryEvent = {
  command: string
  kubbVersion: string
  nodeVersion: string
  /**
   * Name of the JavaScript runtime that executed the run, `'bun'`, `'deno'`, or `'node'`.
   */
  runtime: RuntimeName
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
 * Anonymous OTLP usage telemetry for the Kubb run. All methods are static, so call them as
 * `Telemetry.build(...)`, `Telemetry.send(...)`, and `Telemetry.isDisabled()`. No file paths,
 * OpenAPI specs, or secrets are ever included, and sending fails silently to never break a run.
 */
export class Telemetry {
  /**
   * Returns `true` when telemetry is disabled via `DO_NOT_TRACK` or `KUBB_DISABLE_TELEMETRY`.
   */
  static get isDisabled(): boolean {
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
  static build(options: {
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
      runtime: getRuntimeName(),
      runtimeVersion: getRuntimeVersion().split('.')[0] as string,
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
   * See https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/
   */
  static buildOtlpPayload(event: TelemetryEvent): OtlpExportTraceServiceRequest {
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
            values: event.plugins.map(
              (p): OtlpKvListValue => ({
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
                  kind: 1 satisfies OtlpSpanKind,
                  startTimeUnixNano: String(startTimeNs),
                  endTimeUnixNano: String(endTimeNs),
                  attributes,
                  status: {
                    code: (event.status === 'success' ? 1 : 2) satisfies OtlpStatusCode,
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
   * `KUBB_DISABLE_TELEMETRY`, and fails silently so telemetry never interrupts a run.
   */
  static async send(event: TelemetryEvent): Promise<void> {
    if (Telemetry.isDisabled) {
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
        body: JSON.stringify(Telemetry.buildOtlpPayload(event)),
        signal: AbortSignal.timeout(5_000),
      })
    } catch (_e) {
      // Fail silently, telemetry must never break the run
    }
  }
}
