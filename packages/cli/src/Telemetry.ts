import { randomBytes } from 'node:crypto'
import os from 'node:os'
import process from 'node:process'
import { getElapsedMs, isCIEnvironment, runtime } from '@internals/utils'
import { getAgentProfile } from 'gunshi/agent'
import { version } from '../package.json'

/** OpenTelemetry ingestion endpoint for anonymous usage telemetry. */
const OTLP_ENDPOINT = 'https://otlp.kubb.dev' as const

type TelemetryCommand = 'generate' | 'mcp' | 'studio' | 'validate'

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

/** How a command run ended, as the command reports it to the function {@link trackRun} returned. */
type RunResult = {
  status: 'success' | 'failed'
  plugins?: Array<TelemetryPlugin>
  filesCreated?: number
  /**
   * Name the MCP client sends in its `initialize` request, e.g. `'claude-code'`. Only set for `kubb mcp`.
   */
  mcpClient?: string
}

/**
 * Returns `true` when telemetry is disabled via `DO_NOT_TRACK` or `KUBB_DISABLE_TELEMETRY`.
 */
export function isDisabled(): boolean {
  return ['DO_NOT_TRACK', 'KUBB_DISABLE_TELEMETRY'].some((name) => ['1', 'true'].includes(process.env[name] ?? ''))
}

/** Tracks one command run for the running CLI version; returns the reporter the command calls once it knows how it ended. */
export function trackRun({ command, hrStart }: { command: TelemetryCommand; hrStart: [number, number] }): (result: RunResult) => Promise<void> {
  return (result) => sendTelemetry(buildOtlpPayload({ command, duration: Math.round(getElapsedMs(hrStart)), ...result }))
}

/**
 * The OTLP trace payload for one run: a span named after the command whose attributes are the
 * anonymous run facts. The attribute keys are the contract with otlp.kubb.dev.
 *
 * @see https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/
 */
export function buildOtlpPayload({
  command,
  duration,
  status,
  plugins = [],
  filesCreated = 0,
  mcpClient,
}: RunResult & { command: TelemetryCommand; duration: number }) {
  const traceId = randomBytes(16).toString('hex')
  const spanId = randomBytes(8).toString('hex')
  const endTimeNs = BigInt(Date.now()) * 1_000_000n
  const startTimeNs = endTimeNs - BigInt(duration) * 1_000_000n
  const pluginNames = [...new Set(plugins.map((plugin) => plugin.name))].sort()
  const agent = getAgentProfile()

  const attributes = [
    { key: 'kubb.command', value: { stringValue: command } },
    { key: 'kubb.version', value: { stringValue: version } },
    { key: 'kubb.node_version', value: { stringValue: process.versions.node.split('.')[0] as string } },
    { key: 'kubb.runtime', value: { stringValue: runtime.name } },
    { key: 'kubb.runtime_version', value: { stringValue: runtime.version.split('.')[0] as string } },
    { key: 'kubb.platform', value: { stringValue: os.platform() } },
    { key: 'kubb.ci', value: { boolValue: isCIEnvironment() } },
    // A terminal on stdin means a person typed the command; agents, scripts, and CI pipe it.
    { key: 'kubb.tty', value: { boolValue: process.stdin.isTTY === true } },
    ...(agent.isAgent && agent.name ? [{ key: 'kubb.agent', value: { stringValue: agent.name } }] : []),
    // The client picks this name, so cap its length before it leaves the machine.
    ...(mcpClient ? [{ key: 'kubb.mcp_client', value: { stringValue: mcpClient.slice(0, 64) } }] : []),
    { key: 'kubb.files_created', value: { intValue: filesCreated } },
    { key: 'kubb.status', value: { stringValue: status } },
    {
      key: 'kubb.plugins',
      value: { arrayValue: { values: pluginNames.map((name) => ({ stringValue: name })) } },
    },
    ...pluginNames.map((name) => ({ key: `kubb.plugin.${name}`, value: { boolValue: true } })),
    {
      key: 'kubb.plugin_options',
      value: {
        arrayValue: {
          values: plugins.map((p) => ({
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
            { key: 'service.name', value: { stringValue: 'kubb' } },
            { key: 'service.version', value: { stringValue: version } },
            { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: 'kubb-core', version },
            spans: [
              {
                traceId,
                spanId,
                name: command,
                kind: 1,
                startTimeUnixNano: String(startTimeNs),
                endTimeUnixNano: String(endTimeNs),
                attributes,
                status: {
                  code: status === 'success' ? 1 : 2,
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
 * Send an OTLP payload to the Kubb endpoint. Respects `DO_NOT_TRACK` and
 * `KUBB_DISABLE_TELEMETRY`, and fails silently so telemetry never interrupts a run. No file
 * paths, OpenAPI specs, or secrets are sent.
 */
export async function sendTelemetry(payload: ReturnType<typeof buildOtlpPayload>): Promise<void> {
  if (isDisabled()) {
    return
  }

  try {
    await fetch(`${OTLP_ENDPOINT}/v1/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Kubb-Telemetry-Version': '1',
        'Kubb-Telemetry-Source': 'kubb-cli',
      },
      body: JSON.stringify(payload),
      // Short, since an unfinished request keeps the process alive after the run.
      signal: AbortSignal.timeout(1_000),
    })
  } catch (_e) {
    // Fail silently, telemetry must never break the run
  }
}
