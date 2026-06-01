import { describe, expect, it } from 'vitest'
import { createInitialState, HOOK_LINE_LIMIT, LOG_BUFFER_LIMIT, reducer } from '../state.ts'

describe('reducer', () => {
  it('records the Kubb version on lifecycle:start', () => {
    const state = reducer(createInitialState(), { type: 'lifecycle:start', version: '5.0.0' })
    expect(state.version).toBe('5.0.0')
  })

  it('seeds queued plugins on generation:start and flips to running', () => {
    const started = reducer(createInitialState(), {
      type: 'generation:start',
      configName: 'api',
      pluginNames: ['@kubb/swagger-ts', '@kubb/swagger-zod'],
      at: 1,
    })
    expect(started.status).toBe('running')
    expect(started.plugins).toHaveLength(2)
    expect(started.plugins.every((p) => p.status === 'queued')).toBe(true)
  })

  it('tracks plugin lifecycle from queued → running → done with duration', () => {
    let state = reducer(createInitialState(), {
      type: 'generation:start',
      pluginNames: ['ts'],
      at: 1,
    })
    state = reducer(state, { type: 'plugin:start', name: 'ts' })
    expect(state.plugins[0]?.status).toBe('running')

    state = reducer(state, { type: 'plugin:end', name: 'ts', success: true, duration: 412 })
    expect(state.plugins[0]).toMatchObject({ status: 'done', duration: 412 })
  })

  it('marks failed plugins distinctly', () => {
    let state = reducer(createInitialState(), { type: 'generation:start', pluginNames: ['zod'], at: 1 })
    state = reducer(state, { type: 'plugin:end', name: 'zod', success: false, duration: 99 })
    expect(state.plugins[0]?.status).toBe('failed')
  })

  it('updates file processing counters', () => {
    let state = reducer(createInitialState(), { type: 'files:start', total: 5 })
    expect(state.files).toEqual({ total: 5, processed: 0 })
    state = reducer(state, { type: 'files:update', processed: 3, current: 'src/gen/pet.ts' })
    expect(state.files).toEqual({ total: 5, processed: 3, current: 'src/gen/pet.ts' })
    state = reducer(state, { type: 'files:end' })
    expect(state.files.current).toBeUndefined()
  })

  it('records hook subprocesses and caps stored output lines', () => {
    let state = reducer(createInitialState(), { type: 'hook:start', id: 'h1', command: 'prettier .', at: 1 })
    expect(state.hooks).toHaveLength(1)

    for (let i = 0; i < HOOK_LINE_LIMIT + 25; i++) {
      state = reducer(state, { type: 'hook:line', id: 'h1', line: `line ${i}` })
    }
    expect(state.hooks[0]?.lines).toHaveLength(HOOK_LINE_LIMIT)
    expect(state.hooks[0]?.lines[0]).toBe(`line ${25}`)

    state = reducer(state, { type: 'hook:end', id: 'h1', success: true, at: 2 })
    expect(state.hooks[0]?.status).toBe('done')
  })

  it('caps the log buffer', () => {
    let state = createInitialState()
    for (let i = 0; i < LOG_BUFFER_LIMIT + 50; i++) {
      state = reducer(state, { type: 'log', entry: { level: 'info', message: `m${i}`, at: i } })
    }
    expect(state.logs).toHaveLength(LOG_BUFFER_LIMIT)
    expect(state.logs[0]?.message).toBe(`m${50}`)
  })

  it('flips overall status on generation:end', () => {
    let state = reducer(createInitialState(), { type: 'generation:start', pluginNames: [], at: 1 })
    state = reducer(state, { type: 'generation:end', status: 'success', at: 10 })
    expect(state.status).toBe('success')
    expect(state.finishedAt).toBe(10)
  })

  it('stores update notification', () => {
    const state = reducer(createInitialState(), { type: 'version:new', currentVersion: '5.0.0', latestVersion: '5.1.0' })
    expect(state.updateAvailable).toEqual({ currentVersion: '5.0.0', latestVersion: '5.1.0' })
  })
})
