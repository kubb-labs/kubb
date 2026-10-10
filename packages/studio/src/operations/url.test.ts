import { describe, expect, it } from 'vitest'
import { isLoopbackHost } from './url.ts'

describe('isLoopbackHost', () => {
  it.each(['localhost', '127.0.0.1', '[::1]'])('returns true for %s', (hostname) => {
    expect(isLoopbackHost(hostname)).toBe(true)
  })

  it.each(['studio.kubb.dev', '10.0.0.1', '[fe80::1]'])('returns false for %s', (hostname) => {
    expect(isLoopbackHost(hostname)).toBe(false)
  })
})
