import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('runValidate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')
  })

  afterEach(() => {
    vi.doUnmock('@kubb/adapter-oas')
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('validates input when @kubb/adapter-oas is available', async () => {
    const validate = vi.fn(async () => undefined)
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => ({ validate }),
    }))
    using logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { run: runValidate } = await import('./run.ts')

    await runValidate({ input: 'spec.yaml' })

    expect(validate).toHaveBeenCalledWith('spec.yaml', { throwOnError: true })
    expect(logSpy).toHaveBeenCalledWith('✅ Validation success')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('prints install guidance when @kubb/adapter-oas is missing', async () => {
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => {
        throw new Error("Cannot find module '@kubb/adapter-oas'")
      },
    }))
    using errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    using exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)

    const { run: runValidate } = await import('./run.ts')

    await expect(runValidate({ input: 'spec.yaml' })).rejects.toThrow('process.exit')

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('The @kubb/adapter-oas package is not installed.'))
    expect(errorSpy).toHaveBeenCalledWith('Install it with:')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('npm install @kubb/adapter-oas'))
    expect(errorSpy).toHaveBeenCalledWith("Cannot find module '@kubb/adapter-oas'")
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
