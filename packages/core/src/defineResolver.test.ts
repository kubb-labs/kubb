import { describe, expect, it } from 'vitest'
import { defaultResolveBanner, defaultResolveFile, defaultResolveFooter, defaultResolvePath, defineResolver } from './defineResolver.ts'
import type { Builder, Config, Resolver, ResolverContext } from './types.ts'

type TestResolver = Resolver & {
  greet(name: string): string
  farewell(name: string): string
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

const context: ResolverContext = {
  root: '/root',
  output: { path: 'types' },
  group: undefined,
}

describe('defineResolver', () => {
  it('injects default and resolveOptions', () => {
    const resolver = defineResolver<TestPluginFactory>(() => ({
      pluginName: 'test',
      name: 'test',
      greet(name) {
        return `Hello ${name}`
      },
      farewell(name) {
        return `Goodbye ${name}`
      },
    }))

    expect(resolver.default).toBeTypeOf('function')
    expect(resolver.resolveOptions).toBeTypeOf('function')
    expect(resolver.resolvePath).toBeTypeOf('function')
    expect(resolver.resolveFile).toBeTypeOf('function')
    expect(resolver.name).toBe('test')
  })

  it('build function values override defaults', () => {
    const resolver = defineResolver<TestPluginFactory>(() => ({
      pluginName: 'test',
      name: 'custom',
      default(name) {
        return name.toUpperCase()
      },
      greet(name) {
        return this.default(name)
      },
      farewell(name) {
        return `bye ${this.default(name)}`
      },
    }))

    expect(resolver.default('hello')).toBe('HELLO')
    expect(resolver.greet('world')).toBe('WORLD')
  })
})

describe('defaultResolvePath', () => {
  it('resolves flat path (split mode)', () => {
    const result = defaultResolvePath({ baseName: 'petTypes.ts' }, { root: '/root', output: { path: 'types' }, group: undefined })

    expect(result).toBe('/root/types/petTypes.ts')
  })

  it('returns output dir in single mode', () => {
    const result = defaultResolvePath({ baseName: 'petTypes.ts', pathMode: 'single' }, { root: '/root', output: { path: 'types' }, group: undefined })

    expect(result).toBe('/root/types')
  })

  it('groups by tag when group.type is tag', () => {
    const result = defaultResolvePath({ baseName: 'petTypes.ts', tag: 'pets' }, { root: '/root', output: { path: 'types' }, group: { type: 'tag' } })

    expect(result).toBe('/root/types/petsController/petTypes.ts')
  })

  it('groups by path when group.type is path', () => {
    const result = defaultResolvePath({ baseName: 'petTypes.ts', path: '/pets/list' }, { root: '/root', output: { path: 'types' }, group: { type: 'path' } })

    expect(result).toBe('/root/types/pets/petTypes.ts')
  })

  it('uses custom group.name when provided', () => {
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', tag: 'pets' },
      { root: '/root', output: { path: 'types' }, group: { type: 'tag', name: ({ group }) => `custom_${group}` } },
    )

    expect(result).toBe('/root/types/custom_pets/petTypes.ts')
  })

  it('falls back to flat path when group present but no tag or path given', () => {
    const result = defaultResolvePath({ baseName: 'petTypes.ts' }, { root: '/root', output: { path: 'types' }, group: { type: 'tag' } })

    expect(result).toBe('/root/types/petTypes.ts')
  })
})

describe('defaultResolveFile', () => {
  const resolver = defineResolver<TestPluginFactory>(() => ({ name: 'test', pluginName: 'test', greet: () => '', farewell: () => '' }))

  it('resolves a file with correct baseName and path', () => {
    const file = defaultResolveFile.call(resolver, { name: 'pet', extname: '.ts' }, context)

    expect(file.baseName).toBe('pet.ts')
    expect(file.path).toBe('/root/types/pet.ts')
    expect(file.sources).toEqual([])
    expect(file.imports).toEqual([])
    expect(file.exports).toEqual([])
  })

  it('uses PascalCase file name via resolver.default', () => {
    const file = defaultResolveFile.call(resolver, { name: 'list pets', extname: '.ts' }, context)

    expect(file.baseName).toBe('listPets.ts')
  })

  it('returns output dir path in single mode', () => {
    const file = defaultResolveFile.call(
      resolver,
      { name: 'pet', extname: '.ts' },
      {
        ...context,
        output: {
          ...context.output,
          path: 'types' as const,
        },
      },
    )

    expect(file.path).toBe('/root/types/pet.ts')
    expect(file.baseName).toBe('pet.ts')
  })

  it('groups by tag when resolver is tag-grouped', () => {
    const file = defaultResolveFile.call(
      resolver,
      { name: 'pet', extname: '.ts', tag: 'pets' },
      { root: '/root', output: { path: 'types' }, group: { type: 'tag' } },
    )

    expect(file.path).toBe('/root/types/petsController/pet.ts')
  })
})

const mockConfig = {
  input: { path: 'petStore.yaml' },
  output: { path: 'src/generated', defaultBanner: true },
} as unknown as Config

describe('defaultResolveBanner', () => {
  it('returns default banner when no output.banner is configured', () => {
    const result = defaultResolveBanner(undefined, { config: mockConfig })
    expect(result).toContain('Generated by Kubb')
    expect(result).toContain('petStore.yaml')
  })

  it('returns simple banner when defaultBanner is "simple"', () => {
    const config = { ...mockConfig, output: { ...mockConfig.output, defaultBanner: 'simple' } } as unknown as Config
    const result = defaultResolveBanner(undefined, { config })
    expect(result).toBe('/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n*/\n')
  })

  it('returns undefined when defaultBanner is false', () => {
    const config = { ...mockConfig, output: { ...mockConfig.output, defaultBanner: false } } as unknown as Config
    const result = defaultResolveBanner(undefined, { config })
    expect(result).toBeUndefined()
  })

  it('returns static string banner from output.banner', () => {
    const result = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner: '// custom banner' },
    })
    expect(result).toBe('// custom banner')
  })

  it('calls output.banner function with node when node is provided', () => {
    const node = { title: 'Petstore', description: 'Test API', version: '1.0.0' }
    const result = defaultResolveBanner(node as any, {
      config: mockConfig,
      output: { banner: (n: any) => `// title: ${n.title}` },
    })
    expect(result).toBe('// title: Petstore')
  })

  it('falls back to default banner when output.banner is a function but node is undefined', () => {
    const result = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner: (_n: any) => '// should not be called' },
    })
    expect(result).toContain('Generated by Kubb')
  })
})

describe('defaultResolveFooter', () => {
  it('returns undefined when no output.footer is configured', () => {
    const result = defaultResolveFooter(undefined, { config: mockConfig })
    expect(result).toBeUndefined()
  })

  it('returns static string footer from output.footer', () => {
    const result = defaultResolveFooter(undefined, {
      config: mockConfig,
      output: { footer: '// end of file' },
    })
    expect(result).toBe('// end of file')
  })

  it('calls output.footer function with node when node is provided', () => {
    const node = { title: 'Petstore' }
    const result = defaultResolveFooter(node as any, {
      config: mockConfig,
      output: { footer: (n: any) => `// footer for ${n.title}` },
    })
    expect(result).toBe('// footer for Petstore')
  })

  it('returns undefined when output.footer is a function but node is undefined', () => {
    const result = defaultResolveFooter(undefined, {
      config: mockConfig,
      output: { footer: (_n: any) => '// called' },
    })
    expect(result).toBeUndefined()
  })
})
