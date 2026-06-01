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

  it('moves the task selection cursor within bounds', () => {
    let state = reducer(createInitialState(), { type: 'generation:start', pluginNames: ['a', 'b', 'c'], at: 1 })
    expect(state.selectedTaskIndex).toBe(0)

    state = reducer(state, { type: 'ui:select', delta: 1 })
    expect(state.selectedTaskIndex).toBe(1)

    state = reducer(state, { type: 'ui:select', delta: 5 })
    expect(state.selectedTaskIndex).toBe(2)

    state = reducer(state, { type: 'ui:select', delta: -10 })
    expect(state.selectedTaskIndex).toBe(0)
  })

  it('toggles UI modes', () => {
    let state = createInitialState()
    expect(state.ui.mode).toBe('normal')

    state = reducer(state, { type: 'ui:set-mode', mode: 'help' })
    expect(state.ui.mode).toBe('help')

    state = reducer(state, { type: 'ui:set-mode', mode: 'detail' })
    expect(state.ui.mode).toBe('detail')
  })

  it('clears both log buffers', () => {
    let state = reducer(createInitialState(), { type: 'log', entry: { level: 'info', message: 'hi', at: 1 } })
    state = reducer(state, { type: 'debug', entry: { message: 'd', at: 2 } })
    expect(state.logs).toHaveLength(1)
    expect(state.debug).toHaveLength(1)
    state = reducer(state, { type: 'ui:clear-logs' })
    expect(state.logs).toHaveLength(0)
    expect(state.debug).toHaveLength(0)
  })

  it('attributes log entries to the running plugin', () => {
    let state = reducer(createInitialState(), { type: 'generation:start', pluginNames: ['ts', 'zod'], at: 1 })
    state = reducer(state, { type: 'plugin:start', name: 'ts' })
    state = reducer(state, { type: 'log', entry: { level: 'info', message: 'parsed Pet', at: 2 } })
    state = reducer(state, { type: 'log', entry: { level: 'warn', message: 'missing tag', at: 3 } })
    state = reducer(state, { type: 'plugin:end', name: 'ts', success: true, duration: 12 })
    state = reducer(state, { type: 'log', entry: { level: 'info', message: 'orphan', at: 4 } })

    expect(state.plugins[0]?.events.map((e) => e.message)).toEqual(['parsed Pet', 'missing tag'])
    expect(state.plugins[1]?.events).toEqual([])
    expect(state.currentPluginName).toBeUndefined()
  })

  it('caps the debug stream', () => {
    let state = createInitialState()
    for (let i = 0; i < 600; i++) {
      state = reducer(state, { type: 'debug', entry: { message: `d${i}`, at: i } })
    }
    expect(state.debug).toHaveLength(500)
    expect(state.debug[0]?.message).toBe('d100')
  })
})
