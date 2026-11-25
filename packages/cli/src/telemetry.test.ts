import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import process from 'node:process'
import { runInNewContext } from 'node:vm'
import { Diagnostics } from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildOtlpPayload, isDisabled, SENDER_SCRIPT, sendTelemetry, toOptionShape } from './telemetry.ts'
import type { OtlpPayloadOptions, OtlpSpan } from './telemetry.ts'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

afterEach(() => {
  vi.mocked(spawn).mockReset()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

/** A successful `generate` run, so a payload assertion only states what it varies. */
function payload(overrides: Partial<OtlpPayloadOptions> = {}) {
  return buildOtlpPayload({ command: 'generate', duration: 1000, filesCreated: 5, status: 'success', ...overrides })
}

function getSpan(overrides: Partial<OtlpPayloadOptions> = {}) {
  return payload(overrides).resourceSpans[0]!.scopeSpans[0]!.spans[0]!
}

describe('isDisabled', () => {
  it.each([
    ['DO_NOT_TRACK', '1'],
    ['DO_NOT_TRACK', 'true'],
    ['KUBB_DISABLE_TELEMETRY', '1'],
    ['KUBB_DISABLE_TELEMETRY', 'true'],
  ])('returns true when %s=%s', (name, value) => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')
    vi.stubEnv(name, value)

    expect(isDisabled()).toBe(true)
  })

  it('returns false when neither variable is set', () => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')

    expect(isDisabled()).toBe(false)
  })
})

describe('buildOtlpPayload', () => {
  it.each([
    [true, true],
    [undefined, false],
  ])('reports kubb.tty when stdin.isTTY is %s', (isTTY, expected) => {
    const original = process.stdin.isTTY
    process.stdin.isTTY = isTTY as true
    const attribute = getSpan().attributes.find((attribute) => attribute.key === 'kubb.tty')
    process.stdin.isTTY = original

    expect(attribute).toStrictEqual({ key: 'kubb.tty', value: { boolValue: expected } })
  })

  it('adds the MCP client name only when one is given, capped at 64 characters', () => {
    const find = (span: OtlpSpan) => span.attributes.find((attribute) => attribute.key === 'kubb.mcp_client')

    expect(find(getSpan())).toBeUndefined()
    expect(find(getSpan({ command: 'mcp', mcpClient: 'claude-code' }))).toStrictEqual({ key: 'kubb.mcp_client', value: { stringValue: 'claude-code' } })
    expect(find(getSpan({ command: 'mcp', mcpClient: 'x'.repeat(100) }))?.value).toStrictEqual({ stringValue: 'x'.repeat(64) })
  })

  it.each([
    ['plugin-zod', 'plugin-ts', 'plugin-ts'],
    ['plugin-ts', 'plugin-zod'],
  ])('exposes the same plugin filters regardless of order or duplicates: %j', (...names) => {
    const span = getSpan({ plugins: names.map((name) => ({ name, options: {} })) })
    const filters = span.attributes.filter((attribute) => attribute.key.startsWith('kubb.plugin') && attribute.key !== 'kubb.plugin_options')

    expect(filters).toStrictEqual([
      { key: 'kubb.plugins', value: { arrayValue: { values: [{ stringValue: 'plugin-ts' }, { stringValue: 'plugin-zod' }] } } },
      { key: 'kubb.plugin.plugin-ts', value: { boolValue: true } },
      { key: 'kubb.plugin.plugin-zod', value: { boolValue: true } },
    ])
  })

  it('sends the shape of the plugin options with enum-like values, without usedEnumNames', () => {
    const plugins = [{ name: 'plugin-ts', options: { output: { path: 'types' }, enumType: 'asConst', usedEnumNames: ['Pet'] } }]
    const span = getSpan({ plugins })

    expect(span.attributes.find((attribute) => attribute.key === 'kubb.plugin_options')?.value).toStrictEqual({
      arrayValue: {
        values: [
          {
            kvlistValue: {
              values: [
                { key: 'name', value: { stringValue: 'plugin-ts' } },
                { key: 'options', value: { stringValue: '{"output":{"path":"types"},"enumType":"asConst"}' } },
              ],
            },
          },
        ],
      },
    })
    expect(plugins[0]!.options.usedEnumNames).toStrictEqual(['Pet'])
  })

  it('keeps booleans, numbers and enum-like strings, and replaces secrets, paths, URLs, functions, BigInt and cycles with their type', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' }
    cyclic.self = cyclic

    expect(
      toOptionShape({
        baseURL: 'https://api.internal.example',
        headers: { Authorization: 'Bearer token' },
        apiKey: 'abc123',
        banner: '/* generated */',
        output: { path: './src/gen', clean: true },
        paramsCasing: 'camelcase',
        retries: 3,
        include: [{ type: 'tag', pattern: 'pets' }],
        transform: () => 'x',
        big: 1n,
        cyclic,
      }),
    ).toStrictEqual({
      baseURL: 'string',
      headers: { Authorization: 'string' },
      apiKey: 'string',
      banner: 'string',
      output: { path: 'string', clean: true },
      paramsCasing: 'camelcase',
      retries: 3,
      include: 'array',
      transform: 'function',
      big: 'bigint',
      cyclic: { name: 'loop', self: { name: 'loop', self: { name: 'loop', self: 'object' } } },
    })
  })

  it('sends each problem diagnostic as a grouped span event without its message', () => {
    const span = getSpan({
      status: 'failed',
      diagnostics: [
        { code: Diagnostics.code.refNotFound, severity: 'warning', message: '/home/me/spec.yaml#/Pet', plugin: 'plugin-ts' },
        { code: Diagnostics.code.refNotFound, severity: 'warning', message: '/home/me/spec.yaml#/Order', plugin: 'plugin-ts' },
        { code: Diagnostics.code.internalError, severity: 'error', message: 'boom' },
        Diagnostics.performance({ plugin: 'plugin-ts', duration: 10 }),
      ],
    })

    expect(span.events.map((event) => event.attributes)).toStrictEqual([
      [
        { key: 'kubb.diagnostic.code', value: { stringValue: 'KUBB_REF_NOT_FOUND' } },
        { key: 'kubb.diagnostic.severity', value: { stringValue: 'warning' } },
        { key: 'kubb.diagnostic.plugin', value: { stringValue: 'plugin-ts' } },
        { key: 'kubb.diagnostic.count', value: { intValue: 2 } },
      ],
      [
        { key: 'kubb.diagnostic.code', value: { stringValue: 'KUBB_INTERNAL_ERROR' } },
        { key: 'kubb.diagnostic.severity', value: { stringValue: 'error' } },
        { key: 'kubb.diagnostic.count', value: { intValue: 1 } },
      ],
    ])
    expect(JSON.stringify(span)).not.toContain('/home/me')
  })

  it('builds a valid OTLP trace payload with status code 2 for a failed run', () => {
    const [resourceSpan] = payload({ plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }], status: 'failed' }).resourceSpans
    expect(resourceSpan!.resource.attributes).toContainEqual({
      key: 'service.name',
      value: { stringValue: 'kubb' },
    })
    const [span] = resourceSpan!.scopeSpans[0]!.spans
    expect(span!.name).toBe('generate')
    expect(span!.status?.code).toBe(2)
    expect(span!.traceId).toMatch(/^[0-9a-f]{32}$/)
    expect(span!.spanId).toMatch(/^[0-9a-f]{16}$/)
    expect(typeof span!.startTimeUnixNano).toBe('string')
    expect(typeof span!.endTimeUnixNano).toBe('string')
    expect(span!.attributes.find((attribute) => attribute.key === 'kubb.status')?.value).toStrictEqual({ stringValue: 'failed' })
  })
})

describe('sendTelemetry', () => {
  it('starts no process when DO_NOT_TRACK=1', async () => {
    vi.stubEnv('DO_NOT_TRACK', '1')

    await sendTelemetry(payload({ plugins: [{ name: 'plugin-ts', options: {} }] }))

    expect(spawn).not.toHaveBeenCalled()
  })

  it('pipes the payload to a detached sender process and lets the CLI exit without it', async () => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')
    const child = Object.assign(new EventEmitter(), { stdin: Object.assign(new EventEmitter(), { end: vi.fn() }), unref: vi.fn() })
    vi.mocked(spawn).mockReturnValue(child as never)

    await sendTelemetry(payload())

    expect(spawn).toHaveBeenCalledWith(process.execPath, ['-e', SENDER_SCRIPT], expect.objectContaining({ detached: true }))
    expect(JSON.parse(child.stdin.end.mock.calls[0]![0])).toHaveProperty('resourceSpans')
    expect(child.unref).toHaveBeenCalledOnce()
  })

  it('resolves without throwing when the process cannot start', async () => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')
    vi.mocked(spawn).mockImplementation(() => {
      throw new Error('spawn EAGAIN')
    })

    await expect(sendTelemetry(payload({ duration: 500, filesCreated: 0, status: 'failed' }))).resolves.toBeUndefined()
  })
})

describe('SENDER_SCRIPT', () => {
  it('posts the stdin body to the OTLP endpoint and swallows a network error', async () => {
    const stdin = Object.assign(new EventEmitter(), { setEncoding: () => stdin })
    const fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    runInNewContext(SENDER_SCRIPT, { process: { stdin }, fetch, AbortSignal })
    stdin.emit('data', '{"resourceSpans":')
    stdin.emit('data', '[]}')
    stdin.emit('end')

    expect(fetch).toHaveBeenCalledWith(
      'https://otlp.kubb.dev/v1/traces',
      expect.objectContaining({ method: 'POST', body: '{"resourceSpans":[]}', headers: expect.objectContaining({ 'Kubb-Telemetry-Source': 'kubb-cli' }) }),
    )
  })
})
