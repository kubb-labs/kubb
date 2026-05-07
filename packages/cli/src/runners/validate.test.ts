import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@internals/utils', () => ({
  getErrorMessage: vi.fn((error: unknown) => (error instanceof Error ? error.message : String(error))),
}))

vi.mock('../utils/telemetry.ts', () => ({
  buildTelemetryEvent: vi.fn((payload: object) => payload),
  sendTelemetry: vi.fn(async () => undefined),
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
    const parseDocument = vi.fn(async () => ({ openapi: '3.1.0' }))
    const validateDocument = vi.fn(async () => undefined)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const { runValidate } = await import('./validate.ts')

    await runValidate(
      { input: 'spec.yaml', version: '1.0.0' },
      {
        loadValidateModule: async () =>
          ({
            parseDocument,
            validateDocument,
          }) as unknown as Awaited<ReturnType<(typeof import('./validate.ts'))['loadValidateModule']>>,
      },
    )

    expect(parseDocument).toHaveBeenCalledWith('spec.yaml')
    expect(validateDocument).toHaveBeenCalledWith({ openapi: '3.1.0' }, { throwOnError: true })
    expect(logSpy).toHaveBeenCalledWith('✅ Validation success')
  })

  it('prints install guidance when @kubb/adapter-oas is missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)

    const { runValidate } = await import('./validate.ts')

    await expect(
      runValidate(
        { input: 'spec.yaml', version: '1.0.0' },
        {
          loadValidateModule: async () => {
            throw new Error("Cannot find module '@kubb/adapter-oas'")
          },
        },
      ),
    ).rejects.toThrow('process.exit')

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('The @kubb/adapter-oas package is not installed.'))
    expect(errorSpy).toHaveBeenCalledWith('Install it with:')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('npm install @kubb/adapter-oas'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
