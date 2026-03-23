import { createOperation } from '@kubb/ast'
import { defineResolver, mergeResolvers } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import type { PluginTs, ResolverTs } from '../types.ts'
import { resolverTs } from './resolverTs.ts'
import { resolverTsLegacy } from './resolverTsLegacy.ts'

describe('defineResolver — name property', () => {
  it('resolverTs has name "default"', () => {
    expect(resolverTs.name).toBe('default')
  })

  it('resolverTsLegacy has name "legacy"', () => {
    expect(resolverTsLegacy.name).toBe('legacy')
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

describe('backwards compatibility — legacy flag maps to resolverTsLegacy', () => {
  function buildResolver(options: { legacy?: boolean; resolvers?: Array<ResolverTs> }): ResolverTs {
    const { legacy = false, resolvers: userResolvers } = options
    const defaultResolvers = legacy ? [resolverTsLegacy] : [resolverTs]
    return mergeResolvers(...(userResolvers ?? defaultResolvers))
  }

  const node = createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [],
  })

  it('legacy: false uses default resolver', () => {
    const resolver = buildResolver({ legacy: false })
    expect(resolver.resolveResponsesTypedName(node)).toBe('ListPetsResponses')
  })

  it('legacy: true uses legacy resolver', () => {
    const resolver = buildResolver({ legacy: true })
    expect(resolver.resolveResponsesTypedName(node)).toBe('ListPetsQuery')
  })

  it('explicit resolvers array takes precedence over legacy flag', () => {
    const resolver = buildResolver({ legacy: true, resolvers: [resolverTs] })
    expect(resolver.resolveResponsesTypedName(node)).toBe('ListPetsResponses')
  })
})

