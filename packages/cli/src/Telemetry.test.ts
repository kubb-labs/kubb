import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildOtlpPayload, buildTelemetryEvent, isDisabled, sendTelemetry, type TelemetryPlugin } from './Telemetry.ts'

vi.mock('@internals/utils', async (importActual) => ({
  ...(await importActual<typeof import('@internals/utils')>()),
  executeIfOnline: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}))

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe('isDisabled', () => {
  it('should return false when DO_NOT_TRACK is not set', () => {
    delete process.env['DO_NOT_TRACK']
    delete process.env['KUBB_DISABLE_TELEMETRY']
    expect(isDisabled()).toBe(false)
  })

  it('should return true when DO_NOT_TRACK=1', () => {
    process.env['DO_NOT_TRACK'] = '1'

    expect(isDisabled()).toBe(true)
  })

  it('should return true when DO_NOT_TRACK=true', () => {
    process.env['DO_NOT_TRACK'] = 'true'

    expect(isDisabled()).toBe(true)
  })

  it('should return true when KUBB_DISABLE_TELEMETRY=1', () => {
    delete process.env['DO_NOT_TRACK']
    process.env['KUBB_DISABLE_TELEMETRY'] = '1'

    expect(isDisabled()).toBe(true)
  })

  it('should return true when KUBB_DISABLE_TELEMETRY=true', () => {
    delete process.env['DO_NOT_TRACK']
    process.env['KUBB_DISABLE_TELEMETRY'] = 'true'

    expect(isDisabled()).toBe(true)
  })

  it('should return false when DO_NOT_TRACK is set to a different value', () => {
    process.env['DO_NOT_TRACK'] = '0'

    expect(isDisabled()).toBe(false)
  })
})

describe('buildTelemetryEvent', () => {
  it('should build a telemetry event with safe anonymous data only', () => {
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
  ])('should expose the same plugin filters regardless of order or duplicates: %j', (...names) => {
    const event = buildTelemetryEvent({
      command: 'generate',
      kubbVersion: '4.0.0',
      hrStart: process.hrtime(),
      plugins: names.map((name) => ({ name, options: {} })),
      status: 'success',
    })

    const span = buildOtlpPayload(event).resourceSpans[0]!.scopeSpans[0]!.spans[0]!
    const filters = span.attributes.filter((attribute) => attribute.key.startsWith('kubb.plugin') && attribute.key !== 'kubb.plugin_options')

    expect(filters).toStrictEqual([
      { key: 'kubb.plugins', value: { arrayValue: { values: [{ stringValue: 'plugin-ts' }, { stringValue: 'plugin-zod' }] } } },
      { key: 'kubb.plugin.plugin-ts', value: { boolValue: true } },
      { key: 'kubb.plugin.plugin-zod', value: { boolValue: true } },
    ])
  })

  it('should preserve registered names in plugin filters', () => {
    const event = buildTelemetryEvent({
      command: 'generate',
      kubbVersion: '4.0.0',
      hrStart: process.hrtime(),
      plugins: [
        { name: '@kubb/plugin-ts', options: {} },
        { name: '@custom/plugin-ts', options: {} },
      ],
      status: 'success',
    })

    const span = buildOtlpPayload(event).resourceSpans[0]!.scopeSpans[0]!.spans[0]!

    expect(span.attributes).toContainEqual({ key: 'kubb.plugin.@kubb/plugin-ts', value: { boolValue: true } })
    expect(span.attributes).toContainEqual({ key: 'kubb.plugin.@custom/plugin-ts', value: { boolValue: true } })
  })

  it('should retain every plugin options snapshot separately from plugin names', () => {
    const plugins = [
      { name: 'plugin-ts', options: { output: { path: 'types' }, enumType: 'asConst', usedEnumNames: ['Pet'] } },
      { name: 'plugin-zod', options: { output: { path: 'schemas' }, typed: true } },
      { name: 'plugin-ts', options: { output: { path: 'other-types' }, enumType: 'enum' } },
    ]
    const event = buildTelemetryEvent({ command: 'generate', kubbVersion: '4.0.0', hrStart: process.hrtime(), plugins, status: 'success' })

    const span = buildOtlpPayload(event).resourceSpans[0]!.scopeSpans[0]!.spans[0]!

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

  it('should emit empty plugin summaries without usage flags when no plugins are supplied', () => {
    const event = buildTelemetryEvent({ command: 'validate', kubbVersion: '4.0.0', hrStart: process.hrtime(), status: 'success' })

    const span = buildOtlpPayload(event).resourceSpans[0]!.scopeSpans[0]!.spans[0]!

    expect(span.attributes).toContainEqual({ key: 'kubb.plugins', value: { arrayValue: { values: [] } } })
    expect(span.attributes).toContainEqual({ key: 'kubb.plugin_options', value: { arrayValue: { values: [] } } })
    expect(span.attributes.filter((attribute) => attribute.key.startsWith('kubb.plugin.'))).toStrictEqual([])
  })

  it('should include the kubb.agent attribute when the event has an agent', () => {
    const event: ReturnType<typeof buildTelemetryEvent> = {
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      runtime: 'node',
      runtimeVersion: '20',
      platform: 'linux',
      ci: false,
      agent: 'claude',
      plugins: [],
      duration: 1000,
      filesCreated: 5,
      status: 'success',
    }

    const payload = buildOtlpPayload(event)
    const span = payload.resourceSpans[0]!.scopeSpans[0]!.spans[0]!
    expect(span.attributes).toContainEqual({ key: 'kubb.agent', value: { stringValue: 'claude' } })
  })

  it('should omit the kubb.agent attribute when the event has no agent', () => {
    const event: ReturnType<typeof buildTelemetryEvent> = {
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
    }

    const payload = buildOtlpPayload(event)
    const span = payload.resourceSpans[0]!.scopeSpans[0]!.spans[0]!
    expect(span.attributes.find((a) => a.key === 'kubb.agent')).toBeUndefined()
  })

  it('should build a valid OTLP trace payload', () => {
    const event: ReturnType<typeof buildTelemetryEvent> = {
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      runtime: 'node',
      runtimeVersion: '20',
      platform: 'linux',
      ci: false,
      plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }],
      duration: 1000,
      filesCreated: 5,
      status: 'success',
    }

    const payload = buildOtlpPayload(event)
    expect(payload).toHaveProperty('resourceSpans')
    const [resourceSpan] = payload.resourceSpans
    expect(resourceSpan!.resource.attributes).toContainEqual({
      key: 'service.name',
      value: { stringValue: 'kubb' },
    })
    const [scopeSpan] = resourceSpan!.scopeSpans
    const [span] = scopeSpan!.spans
    expect(span!.name).toBe('generate')
    expect(span!.status?.code).toBe(1)
    expect(typeof span!.traceId).toBe('string')
    expect(span!.traceId).toHaveLength(32)
    expect(typeof span!.spanId).toBe('string')
    expect(span!.spanId).toHaveLength(16)
    expect(typeof span!.startTimeUnixNano).toBe('string')
    expect(typeof span!.endTimeUnixNano).toBe('string')
    const attr = span!.attributes?.find((a) => a.key === 'kubb.status')
    expect(attr?.value).toStrictEqual({ stringValue: 'success' })
  })

  it('should set status code 2 for failed status', () => {
    const event: ReturnType<typeof buildTelemetryEvent> = {
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      runtime: 'node',
      runtimeVersion: '20',
      platform: 'linux',
      ci: false,
      plugins: [],
      duration: 500,
      filesCreated: 0,
      status: 'failed',
    }

    const payload = buildOtlpPayload(event)
    const span = payload?.resourceSpans[0]?.scopeSpans[0]?.spans[0]
    expect(span?.status?.code).toBe(2)
  })
})

describe('sendTelemetry', () => {
  beforeEach(() => {
    delete process.env['DO_NOT_TRACK']
    delete process.env['KUBB_DISABLE_TELEMETRY']
  })

  it('should not send when DO_NOT_TRACK=1', async () => {
    process.env['DO_NOT_TRACK'] = '1'
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await sendTelemetry({
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      runtime: 'node',
      runtimeVersion: '20',
      platform: 'linux',
      ci: false,
      plugins: [{ name: 'plugin-ts', options: {} }],
      duration: 1000,
      filesCreated: 5,
      status: 'success',
    })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should send when telemetry is enabled', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await sendTelemetry({
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      runtime: 'node',
      runtimeVersion: '20',
      platform: 'linux',
      ci: false,
      plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }],
      duration: 1000,
      filesCreated: 5,
      status: 'success',
    })

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

  it('should fail silently when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    await expect(
      sendTelemetry({
        command: 'generate',
        kubbVersion: '4.0.0',
        nodeVersion: '20',
        runtime: 'node',
        runtimeVersion: '20',
        platform: 'linux',
        ci: false,
        plugins: [],
        duration: 500,
        filesCreated: 0,
        status: 'failed',
      }),
    ).resolves.not.toThrow()
  })
})
