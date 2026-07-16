import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it } from 'vitest'
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

const errorDiagnostic: Diagnostic = { code: Diagnostics.code.formatFailed, severity: 'error', message: 'formatter failed', location: { kind: 'config' } }

describe('runGeneration', () => {
  let hooks: Hookable<KubbHooks>

  afterEach(() => hooks?.removeAllHooks())

  it('emits generation:start then generation:end, calling the phases in order', async () => {
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

  it('fails and merges diagnostics when an output pass reports an error', async () => {
    hooks = new Hookable<KubbHooks>()

    const result = await runGeneration(makeConfig(), { hooks, runOutputPasses: async () => [errorDiagnostic] })

    expect(result.success).toBe(false)
    expect(result.diagnostics).toContain(errorDiagnostic)
  })

  it('short-circuits on a build error without running the output passes or onSuccess', async () => {
    hooks = new Hookable<KubbHooks>()
    let passesRan = false
    let successCalled = false

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
  })

  it('routes build diagnostics through a custom renderDiagnostic', async () => {
    hooks = new Hookable<KubbHooks>()
    const rendered: Array<string> = []

    await runGeneration(makeConfig({ adapter: throwingAdapter() }), {
      hooks,
      renderDiagnostic: ({ diagnostic }) => void rendered.push(diagnostic.message),
    })

    expect(rendered.length).toBeGreaterThan(0)
  })
})
