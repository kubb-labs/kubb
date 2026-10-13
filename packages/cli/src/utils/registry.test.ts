import { afterEach, describe, expect, it } from 'vitest'
import { isOutdated, registryUrl, toRegistryId } from './registry.ts'

afterEach(() => {
  delete process.env.KUBB_REGISTRY
})

describe('toRegistryId', () => {
  it('reads a bare slug as an official extension', () => {
    expect([toRegistryId('plugin-zod'), toRegistryId('acme/plugin-x')]).toStrictEqual(['kubb-labs/plugin-zod', 'acme/plugin-x'])
  })

  it.each(['@kubb/plugin-zod', 'acme/plugin-x/extra', '../x', 'Plugin-Zod', 'acme/'])('rejects %s', (input) => {
    expect(() => toRegistryId(input)).toThrow('is not a registry id')
  })
})

describe('registryUrl', () => {
  it('uses KUBB_REGISTRY without its trailing slash, and refuses anything but http(s)', () => {
    expect(registryUrl()).toBe('https://kubb.dev/registry')
    process.env.KUBB_REGISTRY = 'http://localhost:4000/registry/'
    expect(registryUrl()).toBe('http://localhost:4000/registry')
    process.env.KUBB_REGISTRY = 'file:///etc'
    expect(() => registryUrl()).toThrow('must be an http(s) URL')
  })
})

describe('isOutdated', () => {
  it('compares semver, treats an unknown installed version as outdated, and an invalid latest as not newer', () => {
    expect([
      isOutdated({ installed: '1.9.0', latest: '1.10.0' }),
      isOutdated({ installed: '1.10.0', latest: '1.10.0' }),
      isOutdated({ installed: undefined, latest: '1.0.0' }),
      isOutdated({ installed: '1.0.0', latest: 'latest' }),
    ]).toStrictEqual([true, false, true, false])
  })
})
