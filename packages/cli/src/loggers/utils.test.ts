import { describe, expect, it } from 'vitest'
import { createHookTimer, createProgressCounters, recordPluginResult, resetProgressCounters } from './utils.ts'

describe('createProgressCounters', () => {
  it('starts every counter at zero with an hrtime snapshot', () => {
    const state = createProgressCounters()

    expect(state.totalPlugins).toBe(0)
    expect(state.completedPlugins).toBe(0)
    expect(state.failedPlugins).toBe(0)
    expect(state.totalFiles).toBe(0)
    expect(state.processedFiles).toBe(0)
    expect(Array.isArray(state.hrStart)).toBe(true)
    expect(state.hrStart).toHaveLength(2)
  })
})

describe('resetProgressCounters', () => {
  it('resets counters back to zero in place', () => {
    const state = createProgressCounters()
    state.totalPlugins = 5
    state.completedPlugins = 3
    state.failedPlugins = 2
    state.totalFiles = 10
    state.processedFiles = 7

    resetProgressCounters(state)

    expect(state.totalPlugins).toBe(0)
    expect(state.completedPlugins).toBe(0)
    expect(state.failedPlugins).toBe(0)
    expect(state.totalFiles).toBe(0)
    expect(state.processedFiles).toBe(0)
  })
})

describe('recordPluginResult', () => {
  it('increments completedPlugins on success', () => {
    const state = createProgressCounters()

    recordPluginResult(state, true)
    recordPluginResult(state, true)

    expect(state.completedPlugins).toBe(2)
    expect(state.failedPlugins).toBe(0)
  })

  it('increments failedPlugins on failure', () => {
    const state = createProgressCounters()

    recordPluginResult(state, false)

    expect(state.completedPlugins).toBe(0)
    expect(state.failedPlugins).toBe(1)
  })
})

describe('createHookTimer', () => {
  it('returns elapsed milliseconds between start and end', () => {
    const timer = createHookTimer()

    timer.start('a')
    const elapsed = timer.end('a')

    expect(typeof elapsed).toBe('number')
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })

  it('returns undefined when no start was recorded', () => {
    const timer = createHookTimer()

    expect(timer.end('missing')).toBeUndefined()
  })

  it('consumes the start so a second end returns undefined', () => {
    const timer = createHookTimer()

    timer.start('a')
    timer.end('a')

    expect(timer.end('a')).toBeUndefined()
  })
})
