import { describe, expect, it, vi } from 'vitest'
import { resolveDeprecatedFlags } from './deprecatedFlags.ts'

describe('resolveDeprecatedFlags', () => {
  it('rewrites a deprecated camelCase flag to its kebab-case replacement', () => {
    using _ = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(['studio', '--allowWrite'])).toStrictEqual(['studio', '--allow-write'])
  })

  it('rewrites a deprecated flag with an inline value', () => {
    using _ = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(['generate', '--logLevel=verbose'])).toStrictEqual(['generate', '--log-level=verbose'])
  })

  it('warns once per deprecated flag encountered', () => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    resolveDeprecatedFlags(['studio', '--allowWrite', '--allowExec'])

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]?.[0]).toContain('--allowWrite is deprecated, use --allow-write instead')
    expect(spy.mock.calls[1]?.[0]).toContain('--allowExec is deprecated, use --allow-exec instead')
  })

  it('leaves an already kebab-case flag unchanged', () => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(['studio', '--allow-write'])).toStrictEqual(['studio', '--allow-write'])
    expect(spy).not.toHaveBeenCalled()
  })

  it('leaves an unrelated flag and a positional argument unchanged', () => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(['generate', './openapi.yaml', '--watch'])).toStrictEqual(['generate', './openapi.yaml', '--watch'])
    expect(spy).not.toHaveBeenCalled()
  })
})
