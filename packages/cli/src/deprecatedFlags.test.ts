import { describe, expect, it, vi } from 'vitest'
import { resolveDeprecatedFlags } from './deprecatedFlags.ts'

describe('resolveDeprecatedFlags', () => {
  it.each([
    { argv: ['studio', '--allowWrite'], expected: ['studio', '--allow-write'], label: 'a deprecated camelCase flag' },
    { argv: ['generate', '--logLevel=verbose'], expected: ['generate', '--log-level=verbose'], label: 'a deprecated flag with an inline value' },
  ])('rewrites $label to its kebab-case replacement', ({ argv, expected }) => {
    using _ = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(argv)).toStrictEqual(expected)
  })

  it('warns once per deprecated flag encountered', () => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    resolveDeprecatedFlags(['studio', '--allowWrite', '--allowExec'])

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]?.[0]).toContain('--allowWrite is deprecated, use --allow-write instead')
    expect(spy.mock.calls[1]?.[0]).toContain('--allowExec is deprecated, use --allow-exec instead')
  })

  it.each([
    { argv: ['studio', '--allow-write'], label: 'an already kebab-case flag' },
    { argv: ['generate', './openapi.yaml', '--watch'], label: 'an unrelated flag and a positional argument' },
  ])('leaves $label unchanged without a warning', ({ argv }) => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(argv)).toStrictEqual(argv)
    expect(spy).not.toHaveBeenCalled()
  })
})
