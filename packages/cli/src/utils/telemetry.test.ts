import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type TelemetryPlugin, buildOtlpPayload, buildTelemetryEvent, isTelemetryDisabled, sendTelemetry } from './telemetry.ts'

vi.mock('@kubb/core/utils', () => ({
  executeIfOnline: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}))

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe('isTelemetryDisabled', () => {
  it('should return false when DO_NOT_TRACK is not set', () => {
    delete process.env['DO_NOT_TRACK']
    delete process.env['KUBB_DISABLE_TELEMETRY']
    expect(isTelemetryDisabled()).toBe(false)
  })

  it('should return true when DO_NOT_TRACK=1', () => {
    process.env['DO_NOT_TRACK'] = '1'
    expect(isTelemetryDisabled()).toBe(true)
  })

  it('should return true when DO_NOT_TRACK=true', () => {
    process.env['DO_NOT_TRACK'] = 'true'
    expect(isTelemetryDisabled()).toBe(true)
  })

  it('should return true when KUBB_DISABLE_TELEMETRY=1', () => {
    delete process.env['DO_NOT_TRACK']
    process.env['KUBB_DISABLE_TELEMETRY'] = '1'
    expect(isTelemetryDisabled()).toBe(true)
  })

  it('should return true when KUBB_DISABLE_TELEMETRY=true', () => {
    delete process.env['DO_NOT_TRACK']
    process.env['KUBB_DISABLE_TELEMETRY'] = 'true'
    expect(isTelemetryDisabled()).toBe(true)
  })

  it('should return false when DO_NOT_TRACK is set to a different value', () => {
    process.env['DO_NOT_TRACK'] = '0'
    expect(isTelemetryDisabled()).toBe(false)
  })
})

describe('buildTelemetryEvent', () => {
  it('should build a telemetry event with safe anonymous data only', () => {
    const hrStart = process.hrtime()
    const plugins: TelemetryPlugin[] = [
      { name: 'plugin-ts', options: { output: { path: 'types' } } },
      { name: 'plugin-client', options: { output: { path: 'clients' } } },
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
    expect(event.plugins).toEqual(plugins)
    expect(event.filesCreated).toBe(10)
    expect(event.status).toBe('success')
    expect(typeof event.duration).toBe('number')
    expect(event.duration).toBeGreaterThanOrEqual(0)
    expect(typeof event.nodeVersion).toBe('string')
    expect(typeof event.platform).toBe('string')
    expect(typeof event.ci).toBe('boolean')
  })

  it('should detect CI environment', () => {
    process.env['CI'] = 'true'
    const event = buildTelemetryEvent({
      command: 'generate',
      kubbVersion: '4.0.0',
      plugins: [],
      hrStart: process.hrtime(),
      filesCreated: 0,
      status: 'failed',
    })
    expect(event.ci).toBe(true)
    delete process.env['CI']
  })
})

describe('buildOtlpPayload', () => {
  it('should build a valid OTLP trace payload', () => {
    const event: ReturnType<typeof buildTelemetryEvent> = {
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      platform: 'linux',
      ci: false,
      plugins: [{ name: 'plugin-ts', options: { output: { path: 'types' } } }],
      duration: 1000,
      filesCreated: 5,
      status: 'success',
    }

    const payload = buildOtlpPayload(event) as any
    expect(payload).toHaveProperty('resourceSpans')
    const [resourceSpan] = payload.resourceSpans
    expect(resourceSpan.resource.attributes).toContainEqual({ key: 'service.name', value: { stringValue: 'kubb-cli' } })
    const [scopeSpan] = resourceSpan.scopeSpans
    const [span] = scopeSpan.spans
    expect(span.name).toBe('generate')
    expect(span.status.code).toBe(1)
    expect(typeof span.traceId).toBe('string')
    expect(span.traceId).toHaveLength(32)
    expect(typeof span.spanId).toBe('string')
    expect(span.spanId).toHaveLength(16)
    expect(typeof span.startTimeUnixNano).toBe('string')
    expect(typeof span.endTimeUnixNano).toBe('string')
    const attr = span.attributes.find((a: any) => a.key === 'kubb.status')
    expect(attr?.value.stringValue).toBe('success')
  })

  it('should set status code 2 for failed status', () => {
    const event: ReturnType<typeof buildTelemetryEvent> = {
      command: 'generate',
      kubbVersion: '4.0.0',
      nodeVersion: '20',
      platform: 'linux',
      ci: false,
      plugins: [],
      duration: 500,
      filesCreated: 0,
      status: 'failed',
    }

    const payload = buildOtlpPayload(event) as any
    const span = payload.resourceSpans[0].scopeSpans[0].spans[0]
    expect(span.status.code).toBe(2)
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
