import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { type GenerationPhase, runGeneration } from './runGeneration.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Adapter, Config, KubbHooks } from './types.ts'
import { Hookable } from './Hookable.ts'

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
    ...overrides,
  }
}

const throwingAdapter = (): Adapter =>
  createMockedAdapter({
    parse: async () => {
      throw new Error('boom')
    },
  })

const errorDiagnostic: Diagnostic = {
  code: Diagnostics.code.formatFailed,
  severity: 'error',
  message: 'formatter failed',
  location: { kind: 'config' },
}

describe('runGeneration', () => {
  let hooks: Hookable<KubbHooks>

  afterEach(() => hooks?.removeAllHooks())

  it('emits generation:start then generation:end, and calls the phases in order', async () => {
    hooks = new Hookable<KubbHooks>()
    const phases: Array<GenerationPhase> = []
    const events: Array<string> = []
    hooks.hook('kubb:generation:start', () => void events.push('start'))
    hooks.hook('kubb:generation:end', (ctx) => void events.push(`end:${ctx.status}`))

    const result = await runGeneration(makeConfig(), { hooks, onPhase: (phase) => void phases.push(phase) })

    expect(phases).toStrictEqual(['setup', 'build', 'summary'])
    expect(events).toStrictEqual(['start', 'end:success'])
    expect(result.success).toBe(true)
  })

  it('runs the output passes after a successful build and merges their diagnostics', async () => {
    hooks = new Hookable<KubbHooks>()
    const passDiagnostic = Diagnostics.performance({ plugin: 'x', duration: 1 })
    let outputPath: string | undefined

    const result = await runGeneration(makeConfig(), {
      hooks,
      runOutputPasses: async (context) => {
        outputPath = context.outputPath
        return [passDiagnostic]
      },
    })

    expect(outputPath).toContain('gen')
    expect(result.diagnostics).toContain(passDiagnostic)
    expect(result.success).toBe(true)
  })

  it('fails when an output pass returns an error diagnostic', async () => {
    hooks = new Hookable<KubbHooks>()

    const result = await runGeneration(makeConfig(), { hooks, runOutputPasses: async () => [errorDiagnostic] })

    expect(result.success).toBe(false)
    expect(result.diagnostics).toContain(errorDiagnostic)
  })

  it('short-circuits on a build error without running the output passes or onSuccess', async () => {
    hooks = new Hookable<KubbHooks>()
    let passesRan = false
    let successCalled = false
    const endStatus: Array<string | undefined> = []
    hooks.hook('kubb:generation:end', (ctx) => void endStatus.push(ctx.status))

    const result = await runGeneration(makeConfig({ adapter: throwingAdapter() }), {
      hooks,
      runOutputPasses: async () => {
        passesRan = true
        return []
      },
      onSuccess: () => void (successCalled = true),
    })

    expect(result.success).toBe(false)
    expect(passesRan).toBe(false)
    expect(successCalled).toBe(false)
    expect(endStatus).toStrictEqual(['failed'])
  })

  it('calls onSuccess right before generation:end on a successful run', async () => {
    hooks = new Hookable<KubbHooks>()
    const order: Array<string> = []
    hooks.hook('kubb:generation:end', () => void order.push('end'))

    await runGeneration(makeConfig(), { hooks, onSuccess: () => void order.push('success') })

    expect(order).toStrictEqual(['success', 'end'])
  })

  it('carries the provided hrStart into generation:end and the result', async () => {
    hooks = new Hookable<KubbHooks>()
    const hrStart: [number, number] = [123, 456]
    let endHrStart: [number, number] | undefined
    hooks.hook('kubb:generation:end', (ctx) => void (endHrStart = ctx.hrStart))

    const result = await runGeneration(makeConfig(), { hooks, hrStart })

    expect(endHrStart).toStrictEqual(hrStart)
    expect(result.hrStart).toStrictEqual(hrStart)
  })

  it('overrides config.input with the provided input', async () => {
    hooks = new Hookable<KubbHooks>()
    let seenInput: unknown
    hooks.hook('kubb:generation:start', (ctx) => void (seenInput = ctx.config.input))

    await runGeneration(makeConfig({ input: './original.yaml' }), { hooks, input: './override.yaml' })

    expect(seenInput).toBe('./override.yaml')
  })

  it('renders a build error diagnostic through kubb:error', async () => {
    hooks = new Hookable<KubbHooks>()
    const onError = vi.fn()
    hooks.hook('kubb:error', onError)

    await runGeneration(makeConfig({ adapter: throwingAdapter() }), { hooks })

    expect(onError).toHaveBeenCalled()
  })
})
