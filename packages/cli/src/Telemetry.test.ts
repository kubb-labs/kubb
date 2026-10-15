import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildOtlpPayload, isDisabled, sendTelemetry } from './Telemetry.ts'

type Run = Parameters<typeof buildOtlpPayload>[0]

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

/** A successful `generate` run, so a payload assertion only states what it varies. */
function payload(overrides: Partial<Run> = {}) {
  return buildOtlpPayload({ command: 'generate', duration: 1000, filesCreated: 5, status: 'success', ...overrides })
}

function getSpan(overrides: Partial<Run> = {}) {
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
    const find = (span: ReturnType<typeof getSpan>) => span.attributes.find((attribute) => attribute.key === 'kubb.mcp_client')

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

  it('strips usedEnumNames from the plugin options snapshot without touching the options', () => {
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
  it('sends nothing when DO_NOT_TRACK=1', async () => {
    vi.stubEnv('DO_NOT_TRACK', '1')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await sendTelemetry(payload({ plugins: [{ name: 'plugin-ts', options: {} }] }))

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts the OTLP payload when telemetry is enabled', async () => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await sendTelemetry(payload({ plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }] }))

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://otlp.kubb.dev/v1/traces')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Kubb-Telemetry-Source': 'kubb-cli' })
    const body = JSON.parse(init?.body as string)
    expect(body).toHaveProperty('resourceSpans')
    const span = body.resourceSpans[0].scopeSpans[0].spans[0]
    expect(span.name).toBe('generate')
    expect(span.status.code).toBe(1)
  })

  it('resolves without throwing when fetch rejects', async () => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    await expect(sendTelemetry(payload({ duration: 500, filesCreated: 0, status: 'failed' }))).resolves.toBeUndefined()
  })
})
