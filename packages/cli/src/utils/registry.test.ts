import { Diagnostics } from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bumpOf, closestIds, fetchRegistryIndex, isOutdated, registryUrl, toRegistryId, toShortId } from './registry.ts'

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

describe('fetchRegistryIndex', () => {
  it('reports a 200 whose body is not JSON as an invalid index, not as unreachable', async () => {
    using _fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>', { status: 200 }))

    const error = await fetchRegistryIndex({ registry: 'https://example.test' }).catch((caught: unknown) => caught)

    expect(Diagnostics.from(error)).toMatchObject({ code: Diagnostics.code.inputRequestFailed, message: expect.stringContaining('sent an invalid index') })
  })
})

describe('bumpOf', () => {
  it('names the semver part that changed, and nothing for an unknown version', () => {
    expect([
      bumpOf({ installed: '5.2.0', latest: '6.0.0' }),
      bumpOf({ installed: '5.2.0', latest: '5.3.0' }),
      bumpOf({ installed: '5.2.0', latest: '5.2.1' }),
      bumpOf({ installed: undefined, latest: '5.2.1' }),
    ]).toStrictEqual(['major', 'minor', 'patch', undefined])
  })
})

describe('closestIds', () => {
  const ids = ['kubb-labs/plugin-zod', 'kubb-labs/plugin-ts', 'kubb-labs/plugin-faker', 'acme/plugin-graphql']

  it('finds ids with the same words in another order, and ids a few edits away', () => {
    expect(closestIds({ input: 'kubb-labs/zod-plugin', ids })).toStrictEqual(['kubb-labs/plugin-zod'])
    expect(closestIds({ input: 'kubb-labs/plugin-fakr', ids })).toStrictEqual(['kubb-labs/plugin-faker'])
  })

  it('suggests nothing for an id unlike any other', () => {
    expect(closestIds({ input: 'kubb-labs/swagger-mock-server', ids })).toStrictEqual([])
  })
})

describe('toShortId', () => {
  it('drops the kubb-labs owner only', () => {
    expect([toShortId('kubb-labs/plugin-zod'), toShortId('acme/plugin-x')]).toStrictEqual(['plugin-zod', 'acme/plugin-x'])
  })
})
