import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
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
    const summary = stripVTControlCharacters(logSpy.mock.calls.flat().join('\n'))
    expect(summary).toContain('✓ Validation passed')
    expect(summary).toContain('1 specification validated')
    expect(summary).toContain('Input    spec.yaml')
    expect(summary).toContain('Adapter  @kubb/adapter-oas')
    expect(summary).not.toContain('Plugins')
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

    const summary = stripVTControlCharacters(errorSpy.mock.calls.flat().join('\n'))
    expect(summary).toContain('✗ Could not validate')
    expect(summary).toContain('@kubb/adapter-oas · not installed')
    expect(summary).toContain('Install it with:')
    expect(summary).toContain('npm install @kubb/adapter-oas')
    expect(summary).toContain("Cannot find module '@kubb/adapter-oas'")
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('keeps validation diagnostics on stderr without claiming successful checks', async () => {
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => ({
        validate: async () => {
          throw new Error('Unresolved reference: #/components/schemas/Pet')
        },
      }),
    }))
    using _log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    using _exit = vi.spyOn(process, 'exit').mockImplementation((): never => {
      throw new Error('process.exit')
    })
    const { run } = await import('./run.ts')

    await expect(run({ input: 'spec.yaml' })).rejects.toThrow('process.exit')

    const summary = stripVTControlCharacters(error.mock.calls.flat().join('\n'))
    expect(summary).toContain('✗ Validation failed')
    expect(summary).toContain('Unresolved reference: #/components/schemas/Pet')
    expect(summary).not.toContain('specification validated')
    expect(summary).not.toContain('Install it with:')
    expect(_log).not.toHaveBeenCalled()
  })
})
