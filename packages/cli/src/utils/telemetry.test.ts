import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildTelemetryEvent, isTelemetryDisabled, sendTelemetry } from './telemetry.ts'

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
    const event = buildTelemetryEvent({
      command: 'generate',
      kubbVersion: '4.0.0',
      plugins: ['plugin-ts', 'plugin-client'],
      hrStart,
      filesCreated: 10,
      status: 'success',
    })

    expect(event.command).toBe('generate')
    expect(event.kubbVersion).toBe('4.0.0')
    expect(event.plugins).toEqual(['plugin-ts', 'plugin-client'])
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
      plugins: ['plugin-ts'],
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
      plugins: ['plugin-ts'],
      duration: 1000,
      filesCreated: 5,
      status: 'success',
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://telemetry.kubb.dev/api/v1/record')
    expect(init?.method).toBe('POST')
    const body = JSON.parse(init?.body as string)
    expect(body.command).toBe('generate')
    expect(body.kubbVersion).toBe('4.0.0')
    expect(body.plugins).toEqual(['plugin-ts'])
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
