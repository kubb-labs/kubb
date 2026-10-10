import { describe, expect, it } from 'vitest'
import { Diagnostics } from './Diagnostics.ts'
import { getInputKind, inputToAdapterSource } from './input.ts'
import type { Config } from './types.ts'

function createConfig(input: Config['input'], root = '/project'): Config {
  return { root, input } as unknown as Config
}

/**
 * The diagnostic code `fn` throws with, or `undefined` when it returns or throws something else.
 */
function diagnosticCode(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (error) {
    return Diagnostics.isError(error) ? error.diagnostic.code : undefined
  }
  return undefined
}

describe('getInputKind', () => {
  it.each([
    ['a relative path', './petStore.yaml', 'file'],
    ['an absolute path', '/specs/openapi.json', 'file'],
    ['an http(s) address', 'https://example.com/openapi.json', 'url'],
    ['inline JSON content', '{ "openapi": "3.1.0" }', 'inline'],
    ['multi-line YAML content', 'openapi: 3.1.0\ninfo:\n  title: Pets', 'inline'],
    ['a single-line YAML document marker', 'swagger: "2.0"', 'inline'],
    ['a parsed spec', { openapi: '3.1.0' }, 'object'],
  ])('returns %s as %s', (_name, input, expected) => {
    expect(getInputKind(input)).toBe(expected)
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

  it.each([
    ['inline JSON content', '{ "openapi": "3.1.0" }'],
    ['inline YAML content', 'openapi: 3.1.0\ninfo:\n  title: Pets'],
    ['a parsed object', { openapi: '3.1.0' }],
    ['a parsed spec that happens to carry a path property', { openapi: '3.1.0', path: './petStore.yaml' }],
  ])('passes %s as data', (_name, data) => {
    expect(inputToAdapterSource(createConfig(data))).toStrictEqual({ type: 'data', data })
  })

  it.each([
    ['missing', undefined],
    ['an empty string', ''],
  ])('throws a required diagnostic when input is %s', (_name, input) => {
    expect(diagnosticCode(() => inputToAdapterSource(createConfig(input)))).toBe(Diagnostics.code.inputRequired)
  })

  it.each([
    ['a v4 path wrapper', { path: './petStore.yaml' }],
    ['a v4 data wrapper', { data: { openapi: '3.1.0' } }],
    ['a v4 wrapper carrying both keys', { path: './petStore.yaml', data: { openapi: '3.1.0' } }],
    ['a v4 array of path wrappers', [{ path: './petStore.yaml' }]],
  ])('throws a legacy diagnostic for %s', (_name, input) => {
    expect(diagnosticCode(() => inputToAdapterSource(createConfig(input as Config['input'])))).toBe(Diagnostics.code.legacyInput)
  })
})
