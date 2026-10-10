import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildOtlpPayload, buildTelemetryEvent, isDisabled, sendTelemetry, type TelemetryPlugin } from './Telemetry.ts'

type TelemetryEvent = ReturnType<typeof buildTelemetryEvent>

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

/**
 * A built event with every machine-provided field filled in, so a payload assertion only states
 * what it varies.
 */
function makeEvent(overrides: Partial<TelemetryEvent> = {}): TelemetryEvent {
  return {
    command: 'generate',
    kubbVersion: '4.0.0',
    nodeVersion: '20',
    runtime: 'node',
    runtimeVersion: '20',
    platform: 'linux',
    ci: false,
    plugins: [],
    duration: 1000,
    filesCreated: 5,
    status: 'success',
    ...overrides,
  }
}

function getSpan(event: TelemetryEvent) {
  return buildOtlpPayload(event).resourceSpans[0]!.scopeSpans[0]!.spans[0]!
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

  it.each([
    ['', 'neither variable is set'],
    ['0', 'DO_NOT_TRACK is set to a different value'],
  ])('returns false when DO_NOT_TRACK=%s (%s)', (value) => {
    vi.stubEnv('DO_NOT_TRACK', value)
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')

    expect(isDisabled()).toBe(false)
  })
})

describe('buildTelemetryEvent', () => {
  it('builds a telemetry event with safe anonymous data only', () => {
    const hrStart = process.hrtime()
    const plugins: Array<TelemetryPlugin> = [
      { name: 'plugin-ts', options: { output: { path: 'types' } } },
      { name: 'plugin-axios', options: { output: { path: 'clients' } } },
    ]
    const event = buildTelemetryEvent({
      command: 'generate',
      kubbVersion: '4.0.0',
      plugins,
      hrStart,
      filesCreated: 10,
      status: 'success',
    })

    expect(event.command).toBe('generate')
    expect(event.kubbVersion).toBe('4.0.0')
    expect(event.plugins).toStrictEqual(plugins)
    expect(event.filesCreated).toBe(10)
    expect(event.status).toBe('success')
    expect(typeof event.duration).toBe('number')
    expect(event.duration).toBeGreaterThanOrEqual(0)
    expect(typeof event.nodeVersion).toBe('string')
    expect(['bun', 'deno', 'node']).toContain(event.runtime)
    expect(typeof event.runtimeVersion).toBe('string')
    expect(typeof event.platform).toBe('string')
    expect(typeof event.ci).toBe('boolean')
  })
})

describe('buildOtlpPayload', () => {
  it.each([
    ['plugin-zod', 'plugin-ts', 'plugin-ts'],
    ['plugin-ts', 'plugin-zod'],
  ])('exposes the same plugin filters regardless of order or duplicates: %j', (...names) => {
    const span = getSpan(makeEvent({ plugins: names.map((name) => ({ name, options: {} })) }))
    const filters = span.attributes.filter((attribute) => attribute.key.startsWith('kubb.plugin') && attribute.key !== 'kubb.plugin_options')

    expect(filters).toStrictEqual([
      { key: 'kubb.plugins', value: { arrayValue: { values: [{ stringValue: 'plugin-ts' }, { stringValue: 'plugin-zod' }] } } },
      { key: 'kubb.plugin.plugin-ts', value: { boolValue: true } },
      { key: 'kubb.plugin.plugin-zod', value: { boolValue: true } },
    ])
  })

  it('preserves registered names in plugin filters', () => {
    const span = getSpan(
      makeEvent({
        plugins: [
          { name: '@kubb/plugin-ts', options: {} },
          { name: '@custom/plugin-ts', options: {} },
        ],
      }),
    )

    expect(span.attributes).toContainEqual({ key: 'kubb.plugin.@kubb/plugin-ts', value: { boolValue: true } })
    expect(span.attributes).toContainEqual({ key: 'kubb.plugin.@custom/plugin-ts', value: { boolValue: true } })
  })

  it('retains every plugin options snapshot separately from plugin names', () => {
    const plugins = [
      { name: 'plugin-ts', options: { output: { path: 'types' }, enumType: 'asConst', usedEnumNames: ['Pet'] } },
      { name: 'plugin-zod', options: { output: { path: 'schemas' }, typed: true } },
      { name: 'plugin-ts', options: { output: { path: 'other-types' }, enumType: 'enum' } },
    ]
    const span = getSpan(makeEvent({ plugins }))

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
          {
            kvlistValue: {
              values: [
                { key: 'name', value: { stringValue: 'plugin-zod' } },
                { key: 'options', value: { stringValue: '{"output":{"path":"schemas"},"typed":true}' } },
              ],
            },
          },
          {
            kvlistValue: {
              values: [
                { key: 'name', value: { stringValue: 'plugin-ts' } },
                { key: 'options', value: { stringValue: '{"output":{"path":"other-types"},"enumType":"enum"}' } },
              ],
            },
          },
        ],
      },
    })
    expect(plugins[0]!.options.usedEnumNames).toStrictEqual(['Pet'])
  })

  it('emits empty plugin summaries without usage flags when no plugins are supplied', () => {
    const span = getSpan(buildTelemetryEvent({ command: 'validate', kubbVersion: '4.0.0', hrStart: process.hrtime(), status: 'success' }))

    expect(span.attributes).toContainEqual({ key: 'kubb.plugins', value: { arrayValue: { values: [] } } })
    expect(span.attributes).toContainEqual({ key: 'kubb.plugin_options', value: { arrayValue: { values: [] } } })
    expect(span.attributes.filter((attribute) => attribute.key.startsWith('kubb.plugin.'))).toStrictEqual([])
  })

  it.each([
    { agent: 'claude', expected: { key: 'kubb.agent', value: { stringValue: 'claude' } }, label: 'includes' },
    { agent: undefined, expected: undefined, label: 'omits' },
  ])('$label the kubb.agent attribute when the event agent is $agent', ({ agent, expected }) => {
    const span = getSpan(makeEvent({ agent }))

    expect(span.attributes.find((attribute) => attribute.key === 'kubb.agent')).toStrictEqual(expected)
  })

  it.each([
    { status: 'success', code: 1 },
    { status: 'failed', code: 2 },
  ] as const)('builds a valid OTLP trace payload with status code $code for $status', ({ status, code }) => {
    const payload = buildOtlpPayload(makeEvent({ plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }], status }))

    const [resourceSpan] = payload.resourceSpans
    expect(resourceSpan!.resource.attributes).toContainEqual({
      key: 'service.name',
      value: { stringValue: 'kubb' },
    })
    const [span] = resourceSpan!.scopeSpans[0]!.spans
    expect(span!.name).toBe('generate')
    expect(span!.status?.code).toBe(code)
    expect(span!.traceId).toMatch(/^[0-9a-f]{32}$/)
    expect(span!.spanId).toMatch(/^[0-9a-f]{16}$/)
    expect(typeof span!.startTimeUnixNano).toBe('string')
    expect(typeof span!.endTimeUnixNano).toBe('string')
    expect(span!.attributes.find((attribute) => attribute.key === 'kubb.status')?.value).toStrictEqual({ stringValue: status })
  })
})

describe('sendTelemetry', () => {
  it('sends nothing when DO_NOT_TRACK=1', async () => {
    vi.stubEnv('DO_NOT_TRACK', '1')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await sendTelemetry(makeEvent({ plugins: [{ name: 'plugin-ts', options: {} }] }))

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts the OTLP payload when telemetry is enabled', async () => {
    vi.stubEnv('DO_NOT_TRACK', '')
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await sendTelemetry(makeEvent({ plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }] }))

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

    await expect(sendTelemetry(makeEvent({ duration: 500, filesCreated: 0, status: 'failed' }))).resolves.toBeUndefined()
  })
})
