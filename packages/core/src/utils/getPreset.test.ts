import { createSchema } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import { describe, expect, it } from 'vitest'
import { definePreset } from '../definePreset.ts'
import { definePresets } from '../definePresets.ts'
import { defineResolver } from '../defineResolver.ts'
import type { Resolver } from '../types.ts'
import { getPreset } from './getPreset.ts'

type TestResolver = Resolver & {
  schemaName(node: { name: string }): string
}

type TestPluginFactory = {
  name: 'test'
  options: {}
  resolvedOptions: {}
  context: never
  resolvePathOptions: object
  resolver: TestResolver
}

const baseResolver = defineResolver<TestPluginFactory>(() => ({
  name: 'base',
  schemaName(node) {
    return `Base${node.name}`
  },
}))

const legacyResolver = defineResolver<TestPluginFactory>(() => ({
  ...baseResolver,
  name: 'legacy',
  schemaName(node) {
    return `Legacy${node.name}`
  },
}))

const customResolver = defineResolver<TestPluginFactory>(() => ({
  ...baseResolver,
  name: 'custom',
  schemaName(node) {
    return `Custom${node.name}`
  },
}))

const presets = definePresets<TestResolver>({
  default: definePreset('default', {
    resolvers: [],
  }),
  kubbV4: definePreset('kubbV4', {
    resolvers: [legacyResolver],
    transformers: [
      {
        schema(node) {
          if (node.name === 'Pet') {
            return createSchema({ ...node, name: 'PetFromPreset' })
          }
          return undefined
        },
      },
    ],
  }),
})

describe('getPreset', () => {
  it('returns default resolver and default preset for preset: default', () => {
    const result = getPreset({
      preset: 'default',
      presets,
      resolvers: [baseResolver],
    })

    expect(result.preset?.name).toBe('default')
    expect(result.baseResolver.schemaName({ name: 'Pet' })).toBe('BasePet')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('BasePet')
    expect(result.transformers).toEqual([])
  })

  it('applies preset resolver and returns matching preset', () => {
    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver],
    })

    expect(result.preset?.name).toBe('kubbV4')
    expect(result.baseResolver.schemaName({ name: 'Pet' })).toBe('LegacyPet')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('LegacyPet')
  })

  it('applies user resolvers after preset resolver', () => {
    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver, customResolver],
    })

    expect(result.baseResolver.schemaName({ name: 'Pet' })).toBe('LegacyPet')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('CustomPet')
  })

  it('orders transformers as preset first, then user transformers', () => {
    const userTransformer: Visitor = {
      schema(node) {
        if (node.name === 'PetFromPreset') {
          return createSchema({ ...node, name: 'PetFromUser' })
        }
        return undefined
      },
    }

    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver],
      transformers: [userTransformer],
    })

    expect(result.transformers).toEqual([...(presets.kubbV4.transformers ?? []), userTransformer])
  })
})
