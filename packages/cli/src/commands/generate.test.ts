import { describe, expect, it } from 'vitest'
import { parseReporters } from './generate.ts'

describe('generate reporter option', () => {
  it('accepts html as a reporter name', () => {
    expect(parseReporters('html')).toStrictEqual(['html'])
  })

  it('rejects reporter names outside the supported set', () => {
    expect(() => parseReporters('unknown')).toThrow('must be one of cli, json, file, html')
  })
})
