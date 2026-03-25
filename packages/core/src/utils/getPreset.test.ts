import { createSchema } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import { describe, expect, it } from 'vitest'
import { definePreset } from '../definePreset.ts'
import { definePresets } from '../definePresets.ts'
import { defineResolver } from '../defineResolver.ts'
import type { Builder, Resolver } from '../types.ts'
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
  builder: Builder
}

const baseResolver = defineResolver<TestPluginFactory>(() => ({
  name: 'base',
  pluginName: 'test',
  schemaName(node) {
    return `Base${node.name}`
  },
}))

const legacyResolver = defineResolver<TestPluginFactory>(() => ({
  ...baseResolver,
  pluginName: 'test',
  name: 'legacy',
  schemaName(node) {
    return `Legacy${node.name}`
  },
}))

const customResolver = defineResolver<TestPluginFactory>(() => ({
  ...baseResolver,
  pluginName: 'test',
  name: 'custom',
  schemaName(node) {
    return `Custom${node.name}`
  },
}))

const mockGenerator = { name: 'test', type: 'react', version: '2' } as const
const mockUserGenerator = { type: 'react', version: '2', name: 'user' } as const
const mockDefaultGenerator = { type: 'react', version: '2', name: 'default' } as const

const presets = definePresets<TestResolver>({
  default: definePreset('default', {
    resolvers: [],
    generators: [mockDefaultGenerator],
  }),
  kubbV4: definePreset('kubbV4', {
    resolvers: [legacyResolver],
    generators: [mockGenerator],
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
      generators: [],
    })

    expect(result.preset?.name).toBe('default')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('BasePet')
    expect(result.transformers).toEqual([])
  })

  it('applies preset resolver and returns matching preset', () => {
    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver],
      generators: [],
    })

    expect(result.preset?.name).toBe('kubbV4')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('LegacyPet')
  })

  it('applies user resolvers after preset resolver', () => {
    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver, customResolver],
      generators: [],
    })

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
      generators: [],
    })

    expect(result.transformers).toEqual([...(presets.kubbV4.transformers ?? []), userTransformer])
  })

  it('returns preset generators when no user generators are provided', () => {
    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver],
      generators: [],
    })

    expect(result.generators).toEqual([mockGenerator])
  })

  it('appends user generators after preset generators', () => {
    const result = getPreset({
      preset: 'kubbV4',
      presets,
      resolvers: [baseResolver],
      generators: [mockUserGenerator],
    })

    expect(result.generators).toEqual([mockGenerator, mockUserGenerator])
  })

  it('falls back to default preset generators when preset has no generators and user provides none', () => {
    const presetsWithoutKubbV4Generators = definePresets<TestResolver>({
      default: definePreset('default', { resolvers: [], generators: [mockDefaultGenerator] }),
      kubbV4: definePreset('kubbV4', { resolvers: [legacyResolver] }),
    })

    const result = getPreset({
      preset: 'kubbV4',
      presets: presetsWithoutKubbV4Generators,
      resolvers: [baseResolver],
      generators: [],
    })

    expect(result.generators).toEqual([mockDefaultGenerator])
  })

  it('uses user generators (appended after preset) when preset has none', () => {
    const presetsWithoutKubbV4Generators = definePresets<TestResolver>({
      default: definePreset('default', { resolvers: [], generators: [mockDefaultGenerator] }),
      kubbV4: definePreset('kubbV4', { resolvers: [legacyResolver] }),
    })

    const result = getPreset({
      preset: 'kubbV4',
      presets: presetsWithoutKubbV4Generators,
      resolvers: [baseResolver],
      generators: [mockUserGenerator],
    })

    expect(result.generators).toEqual([mockUserGenerator])
  })
})
