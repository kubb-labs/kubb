import { describe, expect, it } from 'vitest'
import { parseStagedPackagesInput } from './listStaged.mjs'

describe('parseStagedPackagesInput', () => {
  it('returns an empty array for an empty input', () => {
    expect(parseStagedPackagesInput('')).toStrictEqual([])
    expect(parseStagedPackagesInput(undefined)).toStrictEqual([])
  })

  it('parses a JSON array of staged packages', () => {
    const input = JSON.stringify([
      { name: 'kubb', version: '4.2.0' },
      { name: '@kubb/core', version: '4.2.0' },
    ])

    expect(parseStagedPackagesInput(input)).toStrictEqual([
      { name: 'kubb', version: '4.2.0' },
      { name: '@kubb/core', version: '4.2.0' },
    ])
  })

  it('throws when the input is not valid JSON', () => {
    expect(() => parseStagedPackagesInput('not json')).toThrow()
  })

  it('throws when an entry is missing a name or version', () => {
    expect(() => parseStagedPackagesInput(JSON.stringify([{ name: 'kubb' }]))).toThrow(/name.*version/)
    expect(() => parseStagedPackagesInput(JSON.stringify([{ version: '4.2.0' }]))).toThrow(/name.*version/)
  })

  it('throws when the input is not an array', () => {
    expect(() => parseStagedPackagesInput(JSON.stringify({ name: 'kubb', version: '4.2.0' }))).toThrow(/array/)
  })
})
