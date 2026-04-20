import { camelCase } from '@internals/utils'
import type { InputNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { defaultResolveBanner, defaultResolveFile, defaultResolveFooter, defaultResolvePath, defineResolver } from './defineResolver.ts'
import type { Config, Resolver, ResolverContext } from './types.ts'

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
}

const context: ResolverContext = {
  root: '/root',
  output: { path: 'types' },
  group: undefined,
}

describe('defineResolver', () => {
  it('injects default and resolveOptions', () => {
    const resolver = defineResolver<TestPluginFactory>((_ctx) => ({
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
    const resolver = defineResolver<TestPluginFactory>((ctx) => ({
      pluginName: 'test',
      name: 'custom',
      default(name) {
        return name.toUpperCase()
      },
      greet(name) {
        return ctx.default(name)
      },
      farewell(name) {
        return `bye ${ctx.default(name)}`
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
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', tag: 'pets' },
      {
        root: '/root',
        output: { path: 'types' },
        group: {
          type: 'tag',
          name: (ctx: { group: string }) => {
            return `${camelCase(ctx.group)}Controller`
          },
        },
      },
    )

    expect(result).toBe('/root/types/petsController/petTypes.ts')
  })

  it('groups by path when group.type is path', () => {
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', path: '/pets/list' },
      {
        root: '/root',
        output: { path: 'types' },
        group: {
          type: 'path',
          name: (ctx: { group: string }) => {
            return `${camelCase(ctx.group)}Controller`
          },
        },
      },
    )

    expect(result).toBe('/root/types/petsListController/petTypes.ts')
  })

  it('uses custom group.name when provided', () => {
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', tag: 'pets' },
      {
        root: '/root',
        output: { path: 'types' },
        group: { type: 'tag', name: ({ group }) => `custom_${group}` },
      },
    )

    expect(result).toBe('/root/types/custom_pets/petTypes.ts')
  })

  it('falls back to flat path when group present but no tag or path given', () => {
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', tag: 'pets' },
      {
        root: '/root',
        output: { path: 'types' },
        group: {
          type: 'tag',
          name: (ctx: { group: string }) => {
            return `${camelCase(ctx.group)}Controller`
          },
        },
      },
    )

    expect(result).toBe('/root/types/petsController/petTypes.ts')
  })

  it('sanitizes traversal segments in default path-based grouping', () => {
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', path: '../../etc/passwd' },
      {
        root: '/root',
        output: { path: 'types' },
        group: { type: 'path' },
      },
    )

    // Traversal components (..) are stripped; first valid segment ('etc') is used as the directory
    expect(result).toBe('/root/types/etc/petTypes.ts')
    // Verify traversal did not escape the output directory
    expect(result).toContain('/root/types/')
    expect(result).not.toContain('..')
  })

  it('throws when a custom group.name returns a path outside the output directory', () => {
    expect(() =>
      defaultResolvePath(
        { baseName: 'petTypes.ts', path: '/pets' },
        {
          root: '/root',
          output: { path: 'types' },
          group: { type: 'path', name: () => '../../secrets' },
        },
      ),
    ).toThrow('[Kubb]')
  })

  it('throws when baseName contains a traversal sequence', () => {
    expect(() => defaultResolvePath({ baseName: '../../etc/passwd' }, { root: '/root', output: { path: 'types' }, group: undefined })).toThrow('[Kubb]')
  })
})

describe('defaultResolveFile', () => {
  const resolver = defineResolver<TestPluginFactory>((_ctx) => ({
    name: 'test',
    pluginName: 'test',
    greet: () => '',
    farewell: () => '',
  }))

  it('resolves a file with correct baseName and path', () => {
    const file = defaultResolveFile({ name: 'pet', extname: '.ts' }, context, resolver)

    expect(file.baseName).toBe('pet.ts')
    expect(file.path).toBe('/root/types/pet.ts')
    expect(file.sources).toEqual([])
    expect(file.imports).toEqual([])
    expect(file.exports).toEqual([])
  })

  it('uses PascalCase file name via resolver.default', () => {
    const file = defaultResolveFile({ name: 'list pets', extname: '.ts' }, context, resolver)

    expect(file.baseName).toBe('listPets.ts')
  })

  it('returns output dir path in single mode', () => {
    const file = defaultResolveFile(
      { name: 'pet', extname: '.ts' },
      {
        ...context,
        output: {
          ...context.output,
          path: 'types' as const,
        },
      },
      resolver,
    )

    expect(file.path).toBe('/root/types/pet.ts')
    expect(file.baseName).toBe('pet.ts')
  })

  it('groups by tag when resolver is tag-grouped', () => {
    const file = defaultResolveFile(
      { name: 'pet', extname: '.ts', tag: 'pets' },
      {
        root: '/root',
        output: { path: 'types' },
        group: {
          type: 'tag',
          name: (ctx: { group: string }) => {
            return `${camelCase(ctx.group)}Controller`
          },
        },
      },
      resolver,
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
    const config = {
      ...mockConfig,
      output: { ...mockConfig.output, defaultBanner: 'simple' },
    } as unknown as Config
    const result = defaultResolveBanner(undefined, { config })
    expect(result).toBe('/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n*/\n')
  })

  it('returns undefined when defaultBanner is false and no user banner', () => {
    const config = {
      ...mockConfig,
      output: { ...mockConfig.output, defaultBanner: false },
    } as unknown as Config
    const result = defaultResolveBanner(undefined, { config })
    expect(result).toBeUndefined()
  })

  it('user string banner overrides the Kubb default', () => {
    const result = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner: '// custom banner' },
    })
    expect(result).toBe('// custom banner')
  })

  it('user function banner overrides the Kubb default when node is provided', () => {
    const node = {
      meta: { title: 'Petstore', description: 'Test API', version: '1.0.0' },
    }
    const result = defaultResolveBanner(node as unknown as InputNode, {
      config: mockConfig,
      output: { banner: (n?: InputNode) => `// title: ${n?.meta?.title}` },
    })
    expect(result).toBe('// title: Petstore')
  })

  it('includes node title and version (but not description) in the Kubb banner when node is provided', () => {
    const node = {
      meta: {
        title: 'Pet API',
        description: 'A very long description',
        version: '2.0.0',
      },
    }
    const result = defaultResolveBanner(node as unknown as InputNode, {
      config: mockConfig,
    })
    expect(result).toContain('Pet API')
    expect(result).toContain('2.0.0')
    expect(result).not.toContain('A very long description')
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
    const result = defaultResolveFooter(node as unknown as InputNode, {
      config: mockConfig,
      output: {
        footer: (n?: InputNode) => `// footer for ${(n as (InputNode & { title?: string }) | undefined)?.title}`,
      },
    })
    expect(result).toBe('// footer for Petstore')
  })

  it('returns undefined when output.footer is a function but node is undefined', () => {
    const result = defaultResolveFooter(undefined, {
      config: mockConfig,
      output: { footer: (_n?: InputNode) => '// called' },
    })
    expect(result).toBeUndefined()
  })
})
