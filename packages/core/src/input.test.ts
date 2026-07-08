import { describe, expect, it } from 'vitest'
import { Diagnostics } from './Diagnostics.ts'
import { getInputKind, inputToAdapterSource } from './input.ts'
import type { Config } from './types.ts'

function createConfig(input: Config['input'], root = '/project'): Config {
  return { root, input } as unknown as Config
}

describe('getInputKind', () => {
  it('classifies a relative path as a file', () => {
    expect(getInputKind('./petStore.yaml')).toBe('file')
  })

  it('classifies an absolute path as a file', () => {
    expect(getInputKind('/specs/openapi.json')).toBe('file')
  })

  it('classifies an http(s) address as a url', () => {
    expect(getInputKind('https://example.com/openapi.json')).toBe('url')
  })

  it('classifies inline JSON content as inline', () => {
    expect(getInputKind('{ "openapi": "3.1.0" }')).toBe('inline')
  })

  it('classifies multi-line YAML content as inline', () => {
    expect(getInputKind('openapi: 3.1.0\ninfo:\n  title: Pets')).toBe('inline')
  })

  it('classifies a single-line YAML document marker as inline', () => {
    expect(getInputKind('swagger: "2.0"')).toBe('inline')
  })

  it('classifies a parsed spec as an object', () => {
    expect(getInputKind({ openapi: '3.1.0' })).toBe('object')
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
