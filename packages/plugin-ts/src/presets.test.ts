import { createOperation } from '@kubb/ast'
import { defineResolver } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { getPreset, presets } from './presets.ts'
import { resolverTs } from './resolvers/resolverTs.ts'
import type { PluginTs } from './types.ts'

describe('presets/getPreset', () => {
  const node = createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [],
  })

  it('exports the expected presets registry', () => {
    expect(presets.default.name).toBe('default')
    expect(presets.kubbV4.name).toBe('kubbV4')
    expect(presets.default.resolvers[0]?.name).toBe('default')
    expect(presets.kubbV4.resolvers[0]?.name).toBe('legacy')
  })

  it('uses default preset resolver behavior', () => {
    const result = getPreset('default')

    expect(result.preset?.name).toBe('default')
    expect(result.resolver.resolveResponsesTypedName(node)).toBe('ListPetsResponses')
  })

  it('uses kubbV4 preset resolver behavior', () => {
    const result = getPreset('kubbV4')

    expect(result.preset?.name).toBe('kubbV4')
    expect(result.resolver.resolveResponsesTypedName(node)).toBe('ListPetsQuery')
    expect(result.baseResolver.resolveDataTypedName(node)).toBe('ListPetsQueryRequest')
  })

  it('keeps baseResolver stable when user overrides are present', () => {
    const { resolver, baseResolver } = getPreset('kubbV4', {
      resolvers: [
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
    expect(baseResolver.resolveDataTypedName(node)).toBe('ListPetsQueryRequest')
  })

  it('passes through user transformers', () => {
    const userTransformer = { schema: () => undefined } as const

    const result = getPreset('kubbV4', {
      transformers: [userTransformer],
    })

    expect(result.transformers).toEqual([userTransformer])
    expect(Array.isArray(result.transformers)).toBe(true)
    expect(result.transformers[0]).toBe(userTransformer)
  })

  it('keeps legacy grouped param resolvers available only for kubbV4 baseResolver', () => {
    const legacyResult = getPreset('kubbV4')
    expect(() => legacyResult.baseResolver.resolvePathParamsName!(node)).not.toThrow()

    const defaultResult = getPreset('default')

    expect(() => defaultResult.baseResolver.resolvePathParamsName!(node)).toThrow(
      "resolvePathParamsName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamName per individual parameter instead.",
    )
  })
})
