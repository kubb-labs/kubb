import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@internals/utils', () => ({
  getErrorMessage: vi.fn((error: unknown) => (error instanceof Error ? error.message : String(error))),
}))

vi.mock('../../Telemetry.ts', () => ({
  Telemetry: {
    build: vi.fn((payload: object) => payload),
    send: vi.fn(async () => undefined),
  },
}))

describe('runValidate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.doUnmock('@kubb/adapter-oas')
    vi.restoreAllMocks()
  })

  it('validates input when @kubb/adapter-oas is available', async () => {
    const validate = vi.fn(async () => undefined)
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => ({ validate }),
    }))
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const { run: runValidate } = await import('./run.ts')

    await runValidate({ input: 'spec.yaml', version: '1.0.0' })

    expect(validate).toHaveBeenCalledWith('spec.yaml', { throwOnError: true })
    expect(logSpy).toHaveBeenCalledWith('✅ Validation success')
  })

  it('prints install guidance when @kubb/adapter-oas is missing', async () => {
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => {
        throw new Error("Cannot find module '@kubb/adapter-oas'")
      },
    }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)

    const { run: runValidate } = await import('./run.ts')

    await expect(runValidate({ input: 'spec.yaml', version: '1.0.0' })).rejects.toThrow('process.exit')

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('The @kubb/adapter-oas package is not installed.'))
    expect(errorSpy).toHaveBeenCalledWith('Install it with:')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('npm install @kubb/adapter-oas'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
