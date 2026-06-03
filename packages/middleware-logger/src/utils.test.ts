import { describe, expect, it } from 'vitest'
import { createHookTimer, formatCommandWithArgs } from './utils.ts'

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

  it('clear drops pending starts', () => {
    const timer = createHookTimer()

    timer.start('a')
    timer.clear()

    expect(timer.end('a')).toBeUndefined()
  })
})

describe('formatCommandWithArgs', () => {
  it('returns the command alone when there are no args', () => {
    expect(formatCommandWithArgs('prettier')).toBe('prettier')
  })

  it('joins the command and its args with spaces', () => {
    expect(formatCommandWithArgs('prettier', ['--write', '.'])).toBe('prettier --write .')
  })

  it('treats an empty args list as no args', () => {
    expect(formatCommandWithArgs('prettier', [])).toBe('prettier')
  })
})
