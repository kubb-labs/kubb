import { Hookable, type KubbHooks } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { collect } from './collector.ts'
import { createStore } from './store.ts'

function setup() {
  const hooks = new Hookable<KubbHooks>()
  const store = createStore()
  const detach = collect({ hooks, store })
  return { hooks, store, detach }
}

// The hook payloads carry far more than the collector reads, so each cast narrows a
// hand-built fixture to the shape under test rather than rebuilding a whole run.
function buildStart(name: string) {
  return { config: { name } } as unknown as KubbHooks['kubb:build:start'][0]
}

function plugin(name: string) {
  return { plugin: { name } } as unknown as KubbHooks['kubb:plugin:start'][0]
}

function pluginEnd({ name, duration, success }: { name: string; duration: number; success: boolean }) {
  return { plugin: { name }, duration, success } as unknown as KubbHooks['kubb:plugin:end'][0]
}

function generatorContext(name: string) {
  return { plugin: { name } } as unknown as KubbHooks['kubb:generate:schema'][1]
}

function schema(name: string) {
  return { kind: 'Schema', name } as unknown as KubbHooks['kubb:generate:schema'][0]
}

describe('collect', () => {
  it('records the config name and marks the run running when a build starts', async () => {
    const { hooks, store } = setup()

    await hooks.callHook('kubb:build:start', buildStart('petstore'))

    expect(store.getSummary()).toMatchObject({ config: 'petstore', status: 'running' })
  })

  it('tracks a plugin from start through to its duration', async () => {
    const { hooks, store } = setup()

    await hooks.callHook('kubb:plugin:start', plugin('plugin-ts'))
    expect(store.getSummary().plugins[0]).toMatchObject({ name: 'plugin-ts', status: 'running', duration: null })

    await hooks.callHook('kubb:plugin:end', pluginEnd({ name: 'plugin-ts', duration: 12, success: true }))
    expect(store.getSummary().plugins[0]).toMatchObject({ name: 'plugin-ts', status: 'success', duration: 12 })
  })

  it('marks a plugin failed and keeps its error message', async () => {
    const { hooks, store } = setup()
    const error = new Error('boom')

    await hooks.callHook('kubb:plugin:start', plugin('plugin-zod'))
    await hooks.callHook('kubb:plugin:end', {
      ...pluginEnd({ name: 'plugin-zod', duration: 3, success: false }),
      error,
    })

    expect(store.getSummary().plugins[0]).toMatchObject({ status: 'failed', error: 'boom' })
  })

  it('keeps a separate node view per plugin', async () => {
    const { hooks, store } = setup()

    await hooks.callHook('kubb:plugin:start', plugin('plugin-ts'))
    await hooks.callHook('kubb:plugin:start', plugin('plugin-zod'))
    await hooks.callHook('kubb:generate:schema', schema('Pet'), generatorContext('plugin-ts'))
    await hooks.callHook('kubb:generate:schema', schema('Order'), generatorContext('plugin-ts'))
    await hooks.callHook('kubb:generate:schema', schema('Pet'), generatorContext('plugin-zod'))

    expect(store.getPluginNames()).toStrictEqual(['plugin-ts', 'plugin-zod'])
    expect(store.getPluginView('plugin-ts')?.schemas).toHaveLength(2)
    expect(store.getPluginView('plugin-zod')?.schemas).toHaveLength(1)
    expect(store.getSummary().plugins.map((entry) => entry.schemaCount)).toStrictEqual([2, 1])
  })

  it('resets the previous run when a rebuild starts', async () => {
    const { hooks, store } = setup()

    await hooks.callHook('kubb:build:start', buildStart('petstore'))
    await hooks.callHook('kubb:plugin:start', plugin('plugin-ts'))
    await hooks.callHook('kubb:generate:schema', schema('Pet'), generatorContext('plugin-ts'))

    const first = store.getSummary().id
    await hooks.callHook('kubb:build:start', buildStart('petstore'))

    expect(store.getSummary().id).toBe(first + 1)
    expect(store.getSummary().plugins).toStrictEqual([])
    expect(store.getPluginNames()).toStrictEqual([])
  })

  it('flattens diagnostics to what the UI renders', async () => {
    const { hooks, store } = setup()

    await hooks.callHook('kubb:diagnostic', {
      diagnostic: {
        code: 'plugin-error',
        severity: 'error',
        message: 'something broke',
        plugin: 'plugin-ts',
        cause: new Error('inner'),
      },
    } as unknown as KubbHooks['kubb:diagnostic'][0])

    expect(store.getSummary().diagnostics).toStrictEqual([{ code: 'plugin-error', severity: 'error', message: 'something broke', plugin: 'plugin-ts' }])
  })

  it('stops updating the store once detached', async () => {
    const { hooks, store, detach } = setup()

    detach()
    await hooks.callHook('kubb:plugin:start', plugin('plugin-ts'))

    expect(store.getSummary().plugins).toStrictEqual([])
  })
})
