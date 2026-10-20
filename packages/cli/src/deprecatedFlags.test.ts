import { describe, expect, it, vi } from 'vitest'
import { resolveDeprecatedFlags } from './deprecatedFlags.ts'

describe('resolveDeprecatedFlags', () => {
  it.each([
    { argv: ['studio', '--allowWrite'], expected: ['studio', '--allow-write'], label: 'a deprecated camelCase flag' },
    { argv: ['generate', '--logLevel=verbose'], expected: ['generate', '--log-level=verbose'], label: 'a deprecated flag with an inline value' },
    { argv: ['update', '--check'], expected: ['update', '--dry-run'], label: 'a flag one command renamed, for that command' },
  ])('rewrites $label to its kebab-case replacement and warns once', ({ argv, expected }) => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(argv)).toStrictEqual(expected)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[0]).toContain(`${argv[1]!.split('=')[0]} is deprecated, use ${expected[1]!.split('=')[0]} instead`)
  })

  it.each([
    { argv: ['studio', '--allow-write'], label: 'an already kebab-case flag' },
    { argv: ['generate', './openapi.yaml', '--watch'], label: 'an unrelated flag and a positional argument' },
    { argv: ['validate', '--check'], label: 'a command-scoped flag on another command' },
  ])('leaves $label unchanged without a warning', ({ argv }) => {
    using spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(resolveDeprecatedFlags(argv)).toStrictEqual(argv)
    expect(spy).not.toHaveBeenCalled()
  })
})
