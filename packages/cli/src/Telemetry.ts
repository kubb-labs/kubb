import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import os from 'node:os'
import process from 'node:process'
import { type Diagnostic, Diagnostics } from '@kubb/core'
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
   * The plugin options as the user passed them. Only their shape is sent, see {@link toOptionShape}.
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
  /**
   * Diagnostics the run collected. Only the code, severity, and plugin of each problem leave the machine.
   */
  diagnostics?: Array<Diagnostic>
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

// An enum-like option value: one word of letters and digits, such as `asConst`, `camelcase` or `zod`.
const ENUM_VALUE = /^[A-Za-z][A-Za-z0-9]{0,31}$/
const SECRET_KEY = /token|secret|password|passwd|auth|credential|api_?key/i

/**
 * The shape of a plugin's options. Booleans, numbers and enum-like strings such as `'asConst'` keep
 * their value. Every other value becomes its type name, so a path, a URL, a banner, or a value under
 * a key such as `token` never leaves the machine. A cycle or `BigInt` cannot make `JSON.stringify` throw.
 *
 * @example
 * toOptionShape({ output: { path: './gen', clean: true }, enumType: 'asConst' })
 * // { output: { path: 'string', clean: true }, enumType: 'asConst' }
 */
export function toOptionShape(value: unknown, depth = 0, key = ''): unknown {
  if (value === undefined || value === null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return ENUM_VALUE.test(value) && !SECRET_KEY.test(key) ? value : 'string'
  if (Array.isArray(value)) return 'array'
  // The depth cap ends a cyclic or deeply nested object without tracking what was visited.
  if (typeof value !== 'object' || depth >= 4) return typeof value
  return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, toOptionShape(item, depth + 1, name)]))
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
  diagnostics = [],
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
                    stringValue: JSON.stringify(toOptionShape({ ...p.options, usedEnumNames: undefined })),
                  },
                },
              ],
            },
          })),
        },
      },
    },
  ]

  // Messages can hold file paths or schema names, so each problem is reduced to its code, severity, and plugin.
  // Grouping by those keeps the payload small when a large spec repeats the same warning.
  const problems = new Map<string, { code: string; severity: string; plugin?: string; count: number }>()
  for (const diagnostic of diagnostics.filter(Diagnostics.isProblem)) {
    const key = `${diagnostic.code}\0${diagnostic.severity}\0${diagnostic.plugin ?? ''}`
    const entry = problems.get(key) ?? { code: diagnostic.code, severity: diagnostic.severity, plugin: diagnostic.plugin, count: 0 }
    entry.count++
    problems.set(key, entry)
  }
  const events = [...problems.values()].map(({ code, severity, plugin, count }) => ({
    name: 'kubb.diagnostic',
    timeUnixNano: String(endTimeNs),
    attributes: [
      { key: 'kubb.diagnostic.code', value: { stringValue: code } },
      { key: 'kubb.diagnostic.severity', value: { stringValue: severity } },
      ...(plugin ? [{ key: 'kubb.diagnostic.plugin', value: { stringValue: plugin } }] : []),
      { key: 'kubb.diagnostic.count', value: { intValue: count } },
    ],
  }))

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
                events,
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
 * Source for the detached process that posts one payload, read from stdin, to the OTLP endpoint.
 * It runs with `node -e` or `bun -e`, so it holds no imports.
 */
export const SENDER_SCRIPT = `let body = ''
process.stdin.setEncoding('utf8').on('data', (chunk) => (body += chunk)).on('end', () => {
  fetch(${JSON.stringify(`${OTLP_ENDPOINT}/v1/traces`)}, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Kubb-Telemetry-Version': '1', 'Kubb-Telemetry-Source': 'kubb-cli' },
    body,
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
})`

/**
 * Send an OTLP payload to the Kubb endpoint. Respects `DO_NOT_TRACK` and
 * `KUBB_DISABLE_TELEMETRY`, and fails silently so telemetry never interrupts a run. No file
 * paths, OpenAPI specs, or secrets are sent.
 *
 * A detached process sends the request, so the CLI exits without waiting on the network.
 */
export async function sendTelemetry(payload: ReturnType<typeof buildOtlpPayload>): Promise<void> {
  if (isDisabled()) {
    return
  }

  try {
    const child = spawn(process.execPath, ['-e', SENDER_SCRIPT], { detached: true, stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true })
    child.on('error', () => {})
    child.stdin?.on('error', () => {})
    child.stdin?.end(JSON.stringify(payload))
    child.unref()
  } catch (_e) {
    // Fail silently, telemetry must never break the run
  }
}
