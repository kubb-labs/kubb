import { createOperation } from '@kubb/ast'
import { defineResolver, mergeResolvers } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { getTsCompatibilityPreset, getTsResolverComposition } from '../presets.ts'
import type { PluginTs, ResolverTs } from '../types.ts'
import { resolverTs } from './resolverTs.ts'
import { resolverTsHeyapi } from './resolverTsHeyapi.ts'
import { resolverTsLegacy } from './resolverTsLegacy.ts'
import { resolverTsOrval } from './resolverTsOrval.ts'

describe('defineResolver — name property', () => {
  it('resolverTs has name "default"', () => {
    expect(resolverTs.name).toBe('default')
  })

  it('resolverTsLegacy has name "legacy"', () => {
    expect(resolverTsLegacy.name).toBe('legacy')
  })

  it('resolverTsHeyapi has name "heyapi"', () => {
    expect(resolverTsHeyapi.name).toBe('heyapi')
  })

  it('resolverTsOrval has name "orval"', () => {
    expect(resolverTsOrval.name).toBe('orval')
  })

  it('custom resolver carries its name', () => {
    const custom = defineResolver<PluginTs>(() => ({
      ...resolverTs,
      name: 'my-resolver',
    }))

    expect(custom.name).toBe('my-resolver')
  })
})

describe('mergeResolvers — last wins', () => {
  it('single resolver produces itself', () => {
    const merged = mergeResolvers(resolverTs)

    expect(merged.resolveTypedName('list pets')).toBe('ListPets')
    expect(merged.name).toBe('default')
  })

  it('later resolver overrides earlier for overridden methods', () => {
    const custom = defineResolver<PluginTs>(() => ({
      ...resolverTs,
      name: 'suffix',
      resolveTypedName(name: string) {
        return `${resolverTs.resolveTypedName(name)}Type`
      },
    }))

    const merged = mergeResolvers(resolverTs, custom)

    expect(merged.resolveTypedName('list pets')).toBe('ListPetsType')
    expect(merged.resolveName('list pets')).toBe(resolverTs.resolveName('list pets'))
  })

  it('legacy resolver overrides default response naming', () => {
    const merged = mergeResolvers(resolverTs, resolverTsLegacy)
    const node = createOperation({
      operationId: 'createPets',
      method: 'POST',
      path: '/pets',
      tags: ['pets'],
      responses: [],
    })

    expect(merged.resolveResponseStatusTypedName(node, 'default')).toBe('CreatePetsError')
    expect(merged.resolveDataTypedName(node)).toBe('CreatePetsMutationRequest')
  })

  it('three resolvers — last wins for conflicting methods', () => {
    const first = defineResolver<PluginTs>(() => ({
      ...resolverTs,
      name: 'first',
      resolveTypedName(name: string) {
        return `First${resolverTs.resolveTypedName(name)}`
      },
    }))

    const second = defineResolver<PluginTs>(() => ({
      ...resolverTs,
      name: 'second',
      resolveTypedName(name: string) {
        return `Second${resolverTs.resolveTypedName(name)}`
      },
    }))

    const merged = mergeResolvers(resolverTs, first, second)

    expect(merged.resolveTypedName('pet')).toBe('SecondPet')
    expect(merged.name).toBe('second')
  })
})

describe('backwards compatibility — kubbV4 preset maps to resolverTsLegacy', () => {
  function buildResolver(options: { compatibilityPreset?: 'none' | 'kubbV4' | 'heyapi' | 'orval'; resolvers?: Array<ResolverTs> }): ResolverTs {
    const { compatibilityPreset = 'none', resolvers: userResolvers } = options
    return getTsResolverComposition({
      compatibilityPreset,
      userResolvers,
    }).resolver
  }

  const node = createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [],
  })

  it('compatibilityPreset: none uses default resolver', () => {
    const resolver = buildResolver({ compatibilityPreset: 'none' })
    expect(resolver.resolveResponsesTypedName(node)).toBe('ListPetsResponses')
  })

  it('compatibilityPreset: kubbV4 uses legacy resolver behavior', () => {
    const resolver = buildResolver({ compatibilityPreset: 'kubbV4' })
    expect(resolver.resolveResponsesTypedName(node)).toBe('ListPetsQuery')
  })

  it('kubbV4 base resolver remains, user resolvers override conflicting methods', () => {
    const resolver = buildResolver({
      compatibilityPreset: 'kubbV4',
      resolvers: [
        defineResolver<PluginTs>(() => ({
          ...resolverTsLegacy,
          name: 'custom',
          resolveResponsesTypedName(_node) {
            return 'CustomResponses'
          },
        })),
      ],
    })
    expect(resolver.resolveResponsesTypedName(node)).toBe('CustomResponses')
    expect(resolver.resolveDataTypedName(node)).toBe('ListPetsQueryRequest')
  })

  it('compatibilityPreset: heyapi applies heyapi naming', () => {
    const resolver = buildResolver({ compatibilityPreset: 'heyapi' })
    expect(resolver.resolveDataTypedName(node)).toBe('ListPetsRequest')
    expect(resolver.resolveResponseTypedName(node)).toBe('ListPetsResult')
  })

  it('compatibilityPreset: orval applies orval naming', () => {
    const resolver = buildResolver({ compatibilityPreset: 'orval' })
    expect(resolver.resolveDataTypedName(node)).toBe('ListPetsQueryRequest')
    expect(resolver.resolveResponseTypedName(node)).toBe('ListPetsQueryResult')
  })

  it('preset is composed before user resolvers (user wins conflicts)', () => {
    const resolver = buildResolver({
      compatibilityPreset: 'orval',
      resolvers: [
        defineResolver<PluginTs>(() => ({
          ...resolverTsOrval,
          name: 'custom',
          resolveResponseTypedName(_node) {
            return 'CustomResult'
          },
        })),
      ],
    })
    expect(resolver.resolveResponseTypedName(node)).toBe('CustomResult')
    expect(resolver.resolveDataTypedName(node)).toBe('ListPetsQueryRequest')
  })
})

describe('compatibility presets registry', () => {
  const node = createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [],
  })

  it('returns undefined for none', () => {
    expect(getTsCompatibilityPreset('none')).toBeUndefined()
  })

  it('returns heyapi preset definition', () => {
    const preset = getTsCompatibilityPreset('heyapi')

    expect(preset?.name).toBe('heyapi')
    expect(preset?.resolvers[0]?.name).toBe('heyapi')
  })

  it('returns orval preset definition', () => {
    const preset = getTsCompatibilityPreset('orval')

    expect(preset?.name).toBe('orval')
    expect(preset?.resolvers[0]?.name).toBe('orval')
  })

  it('returns kubbV4 preset definition', () => {
    const preset = getTsCompatibilityPreset('kubbV4')

    expect(preset?.name).toBe('kubbV4')
    expect(preset?.resolvers[0]?.name).toBe('legacy')
  })

  it('keeps baseResolver stable when user overrides are present', () => {
    const { resolver, baseResolver } = getTsResolverComposition({
      compatibilityPreset: 'heyapi',
      userResolvers: [
        defineResolver<PluginTs>(() => ({
          ...resolverTs,
          name: 'custom',
          resolveDataTypedName(_node) {
            return 'CustomRequest'
          },
        })),
      ],
    })

    expect(resolver.resolveDataTypedName(node)).toBe('CustomRequest')
    expect(baseResolver.resolveDataTypedName(node)).toBe('ListPetsRequest')
  })

  it('composes preset transformers before user transformers', () => {
    const userTransformer = { schema: () => undefined } as const

    const result = getTsResolverComposition({
      compatibilityPreset: 'orval',
      userTransformers: [userTransformer],
    })

    expect(result.transformers).toEqual([userTransformer])
    expect(Array.isArray(result.transformers)).toBe(true)
    expect(result.transformers[0]).toBe(userTransformer)
  })
})
