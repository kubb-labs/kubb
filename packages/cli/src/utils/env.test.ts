import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canUseTTY } from './env.ts'

const originalIsTTY = process.stdout.isTTY
const originalColumns = process.stdout.columns

afterEach(() => {
  vi.unstubAllEnvs()
  Object.defineProperty(process.stdout, 'isTTY', {
    value: originalIsTTY,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(process.stdout, 'columns', {
    value: originalColumns,
    writable: true,
    configurable: true,
  })
})

describe('canUseTTY', () => {
  beforeEach(() => {
    vi.stubEnv('CI', '')
    vi.stubEnv('GITHUB_ACTIONS', '')
  })

  it.each([
    {
      isTTY: true,
      columns: 80,
      ci: '',
      expected: true,
      label: 'isTTY with valid columns and no CI',
    },
    { isTTY: false, columns: 80, ci: '', expected: false, label: 'no isTTY' },
    {
      isTTY: true,
      columns: 80,
      ci: 'true',
      expected: false,
      label: 'isTTY but in CI',
    },
    {
      isTTY: true,
      columns: 0,
      ci: '',
      expected: false,
      label: 'isTTY but columns is 0 (broken IDE terminal)',
    },
    {
      isTTY: true,
      columns: undefined,
      ci: '',
      expected: false,
      label: 'isTTY but columns is undefined',
    },
  ])('returns $expected when $label', ({ isTTY, columns, ci, expected }) => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: isTTY,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(process.stdout, 'columns', {
      value: columns,
      writable: true,
      configurable: true,
    })
    vi.stubEnv('CI', ci)
    expect(canUseTTY()).toBe(expected)
  })
})
