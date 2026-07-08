import { describe, expect, it } from 'vitest'
import { Diagnostics } from './Diagnostics.ts'
import { inputToAdapterSource, isInlineDocument } from './input.ts'
import type { Config } from './types.ts'

function createConfig(input: Config['input'], root = '/project'): Config {
  return { root, input } as unknown as Config
}

describe('isInlineDocument', () => {
  it('treats a relative path as a reference, not inline content', () => {
    expect(isInlineDocument('./petStore.yaml')).toBe(false)
  })

  it('treats an absolute path as a reference, not inline content', () => {
    expect(isInlineDocument('/specs/openapi.json')).toBe(false)
  })

  it('treats a URL as a reference, not inline content', () => {
    expect(isInlineDocument('https://example.com/openapi.json')).toBe(false)
  })

  it('detects inline JSON content', () => {
    expect(isInlineDocument('{ "openapi": "3.1.0" }')).toBe(true)
  })

  it('detects multi-line YAML content', () => {
    expect(isInlineDocument('openapi: 3.1.0\ninfo:\n  title: Pets')).toBe(true)
  })

  it('detects a single-line YAML document marker', () => {
    expect(isInlineDocument('swagger: "2.0"')).toBe(true)
  })
})

describe('inputToAdapterSource', () => {
  it('resolves a relative path against the config root', () => {
    expect(inputToAdapterSource(createConfig('./petStore.yaml'))).toStrictEqual({
      type: 'path',
      path: '/project/petStore.yaml',
    })
  })

  it('keeps a URL verbatim', () => {
    expect(inputToAdapterSource(createConfig('https://example.com/openapi.json'))).toStrictEqual({
      type: 'path',
      path: 'https://example.com/openapi.json',
    })
  })

  it('passes inline JSON content as data', () => {
    const data = '{ "openapi": "3.1.0" }'
    expect(inputToAdapterSource(createConfig(data))).toStrictEqual({ type: 'data', data })
  })

  it('passes inline YAML content as data', () => {
    const data = 'openapi: 3.1.0\ninfo:\n  title: Pets'
    expect(inputToAdapterSource(createConfig(data))).toStrictEqual({ type: 'data', data })
  })

  it('passes a parsed object as data', () => {
    const data = { openapi: '3.1.0' }
    expect(inputToAdapterSource(createConfig(data))).toStrictEqual({ type: 'data', data })
  })

  it('throws a required diagnostic when input is missing', () => {
    try {
      inputToAdapterSource(createConfig(undefined))
      expect.unreachable('expected inputToAdapterSource to throw')
    } catch (error) {
      expect(Diagnostics.isError(error) && error.diagnostic.code).toBe(Diagnostics.code.inputRequired)
    }
  })

  it('throws a required diagnostic when input is an empty string', () => {
    try {
      inputToAdapterSource(createConfig(''))
      expect.unreachable('expected inputToAdapterSource to throw')
    } catch (error) {
      expect(Diagnostics.isError(error) && error.diagnostic.code).toBe(Diagnostics.code.inputRequired)
    }
  })
})
