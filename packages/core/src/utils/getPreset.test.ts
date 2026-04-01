import { createSchema } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import { describe, expect, it } from 'vitest'
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

const mockGenerator = { name: 'test', type: 'react', version: '2' } as const
const mockUserGenerator = { type: 'react', version: '2', name: 'user' } as const
const mockDefaultGenerator = { type: 'react', version: '2', name: 'default' } as const

const presets = definePresets<TestResolver>({
  default: {
    name: 'default',
    resolver: baseResolver,
    generators: [mockDefaultGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolver: legacyResolver,
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
  },
})

describe('getPreset', () => {
  it('returns preset resolver when no user resolver provided', () => {
    const result = getPreset({ preset: 'default', presets, generators: [] })

    expect(result.preset?.name).toBe('default')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('BasePet')
    expect(result.transformer).toBeUndefined()
  })

  it('applies kubbV4 preset resolver', () => {
    const result = getPreset({ preset: 'kubbV4', presets, generators: [] })

    expect(result.preset?.name).toBe('kubbV4')
    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('LegacyPet')
  })

  it('user resolver method overrides preset when it returns a non-null value', () => {
    const result = getPreset({
      preset: 'default',
      presets,
      resolver: { schemaName: () => 'Overridden' },
      generators: [],
    })

    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('Overridden')
  })

  it('user resolver method falls back to preset when it returns null', () => {
    const result = getPreset({
      preset: 'default',
      presets,
      resolver: { schemaName: () => null as unknown as string },
      generators: [],
    })

    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('BasePet')
  })

  it('user resolver method falls back to preset when it returns undefined', () => {
    const result = getPreset({
      preset: 'default',
      presets,
      resolver: { schemaName: () => undefined as unknown as string },
      generators: [],
    })

    expect(result.resolver.schemaName({ name: 'Pet' })).toBe('BasePet')
  })

  it('user transformer method overrides preset transformer when non-null', () => {
    const userTransformer: Visitor = {
      schema(node) {
        return createSchema({ ...node, name: 'UserOverride' })
      },
    }

    const result = getPreset({ preset: 'kubbV4', presets, transformer: userTransformer, generators: [] })

    const input = createSchema({ name: 'Pet', type: 'string' })
    const output = result.transformer!.schema!(input, {} as any)
    expect(output?.name).toBe('UserOverride')
  })

  it('user transformer method falls back to preset transformer when it returns null', () => {
    const userTransformer: Visitor = {
      schema() {
        return null as any
      },
    }

    const result = getPreset({ preset: 'kubbV4', presets, transformer: userTransformer, generators: [] })

    const input = createSchema({ name: 'Pet', type: 'string' })
    const output = result.transformer!.schema!(input, {} as any)
    expect(output?.name).toBe('PetFromPreset')
  })

  it('returns preset transformer without wrapping when no user transformer provided', () => {
    const result = getPreset({ preset: 'kubbV4', presets, generators: [] })

    const input = createSchema({ name: 'Pet', type: 'string' })
    const output = result.transformer!.schema!(input, {} as any)
    expect(output?.name).toBe('PetFromPreset')
  })

  it('returns undefined transformer when preset has no transformers and no user transformer', () => {
    const result = getPreset({ preset: 'default', presets, generators: [] })

    expect(result.transformer).toBeUndefined()
  })

  it('returns preset generators', () => {
    const result = getPreset({ preset: 'kubbV4', presets, generators: [] })

    expect(result.generators).toEqual([mockGenerator])
  })

  it('appends user generators after preset generators', () => {
    const result = getPreset({ preset: 'kubbV4', presets, generators: [mockUserGenerator] })

    expect(result.generators).toEqual([mockGenerator, mockUserGenerator])
  })

  it('falls back to default preset generators when preset has none and user provides none', () => {
    const presetsWithoutKubbV4Generators = definePresets<TestResolver>({
      default: {
        name: 'default',
        resolver: baseResolver,
        generators: [mockDefaultGenerator],
      },
      kubbV4: {
        name: 'kubbV4',
        resolver: legacyResolver,
      },
    })

    const result = getPreset({ preset: 'kubbV4', presets: presetsWithoutKubbV4Generators, generators: [] })

    expect(result.generators).toEqual([mockDefaultGenerator])
  })

  it('uses user generators when preset has none', () => {
    const presetsWithoutKubbV4Generators = definePresets<TestResolver>({
      default: {
        name: 'default',
        resolver: baseResolver,
        generators: [mockDefaultGenerator],
      },
      kubbV4: {
        name: 'kubbV4',
        resolver: legacyResolver,
      },
    })

    const result = getPreset({ preset: 'kubbV4', presets: presetsWithoutKubbV4Generators, generators: [mockUserGenerator] })

    expect(result.generators).toEqual([mockUserGenerator])
  })
})
