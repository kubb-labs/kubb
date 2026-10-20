import { describe, expect, it } from 'vitest'
import { wantsMascot } from './mascot.ts'

describe('wantsMascot', () => {
  const ask = (commandPath: Array<string>, values: Record<string, unknown> = {}, tty = true) => {
    const original = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    Object.defineProperty(process.stdin, 'isTTY', { value: tty, configurable: true })
    try {
      return wantsMascot({ commandPath, values })
    } finally {
      if (original) Object.defineProperty(process.stdin, 'isTTY', original)
      else Reflect.deleteProperty(process.stdin, 'isTTY')
    }
  }

  it('opens generate and interactive commands with the mascot, and quick or scripted runs without it', () => {
    expect(ask(['generate'])).toBe(true)
    expect(ask(['init'])).toBe(true)
    expect(ask(['init'], { yes: true })).toBe(false)
    expect(ask(['add'], {}, false)).toBe(false)
    expect(ask(['generate'], { help: true })).toBe(false)
    expect(ask(['validate'])).toBe(false)
  })
})
