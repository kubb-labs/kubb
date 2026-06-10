import { camelCase } from '@internals/utils'
import type { InputMeta } from '@kubb/ast'
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
  resolver: TestResolver
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
    const resolver = defineResolver<TestPluginFactory>(() => {
      const build = {
        pluginName: 'test' as const,
        name: 'custom',
        default(name: string) {
          return name.toUpperCase()
        },
        greet(name: string) {
          return build.default(name)
        },
        farewell(name: string) {
          return `bye ${build.default(name)}`
        },
      }
      return build
    })

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

  it('groups by tag using the plain camelCased tag by default', () => {
    const result = defaultResolvePath(
      { baseName: 'petTypes.ts', tag: 'pet store' },
      {
        root: '/root',
        output: { path: 'types' },
        group: { type: 'tag' },
      },
    )

    expect(result).toBe('/root/types/petStore/petTypes.ts')
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
    ).toThrow('outside the output directory')
  })

  it('throws when baseName contains a traversal sequence', () => {
    expect(() => defaultResolvePath({ baseName: '../../etc/passwd' }, { root: '/root', output: { path: 'types' }, group: undefined })).toThrow(
      'outside the output directory',
    )
  })
})

describe('defaultResolveFile', () => {
  const resolver = defineResolver<TestPluginFactory>(() => ({
    name: 'test',
    pluginName: 'test',
    greet: () => '',
    farewell: () => '',
  }))

  it('resolves a file with correct baseName and path', () => {
    const file = defaultResolveFile.call(resolver, { name: 'pet', extname: '.ts' }, context)

    expect(file.baseName).toBe('pet.ts')
    expect(file.path).toBe('/root/types/pet.ts')
    expect(file.sources).toStrictEqual([])
    expect(file.imports).toStrictEqual([])
    expect(file.exports).toStrictEqual([])
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
      {
        root: '/root',
        output: { path: 'types' },
        group: { type: 'tag' },
      },
    )

    expect(file.path).toBe('/root/types/pets/pet.ts')
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

  it('returns null when defaultBanner is false and no user banner', () => {
    const config = {
      ...mockConfig,
      output: { ...mockConfig.output, defaultBanner: false },
    } as unknown as Config
    const result = defaultResolveBanner(undefined, { config })
    expect(result).toBeNull()
  })

  it('user string banner overrides the Kubb default', () => {
    const result = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner: '// custom banner' },
    })
    expect(result).toBe('// custom banner')
  })

  it('user function banner overrides the Kubb default when meta is provided', () => {
    const meta: InputMeta = { title: 'Petstore', description: 'Test API', version: '1.0.0', circularNames: [], enumNames: [] }
    const result = defaultResolveBanner(meta, {
      config: mockConfig,
      output: { banner: (m?: InputMeta) => `// title: ${m?.title}` },
    })
    expect(result).toBe('// title: Petstore')
  })

  it('includes meta title and version (but not description) in the Kubb banner when meta is provided', () => {
    const meta: InputMeta = { title: 'Pet API', description: 'A very long description', version: '2.0.0', circularNames: [], enumNames: [] }
    const result = defaultResolveBanner(meta, {
      config: mockConfig,
    })
    expect(result).toContain('Pet API')
    expect(result).toContain('2.0.0')
    expect(result).not.toContain('A very long description')
  })

  it('function banner receives per-file context and can skip aggregation files', () => {
    const banner = (m: { isBarrel: boolean; isAggregation: boolean }) => (m.isBarrel || m.isAggregation ? '' : "'use server'")

    const aggregation = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner },
      file: { path: 'src/gen/clients/stocks/stocks.ts', baseName: 'stocks.ts', isAggregation: true },
    })
    const barrel = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner },
      file: { path: 'src/gen/clients/index.ts', baseName: 'index.ts', isBarrel: true },
    })
    const source = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner },
      file: { path: 'src/gen/clients/getStock.ts', baseName: 'getStock.ts' },
    })

    expect(aggregation).toBe('')
    expect(barrel).toBe('')
    expect(source).toBe("'use server'")
  })

  it('function banner receives filePath and baseName from the file context', () => {
    const result = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner: (m) => `// ${m.baseName} @ ${m.filePath}` },
      file: { path: 'a/b.ts', baseName: 'b.ts' },
    })
    expect(result).toBe('// b.ts @ a/b.ts')
  })

  it('per-file fields default to false/empty when no file context is provided', () => {
    const result = defaultResolveBanner(undefined, {
      config: mockConfig,
      output: { banner: (m) => `${m.isBarrel}-${m.isAggregation}-[${m.filePath}]-[${m.baseName}]` },
    })
    expect(result).toBe('false-false-[]-[]')
  })
})

describe('defaultResolveFooter', () => {
  it('returns null when no output.footer is configured', () => {
    const result = defaultResolveFooter(undefined, { config: mockConfig })
    expect(result).toBeNull()
  })

  it('returns static string footer from output.footer', () => {
    const result = defaultResolveFooter(undefined, {
      config: mockConfig,
      output: { footer: '// end of file' },
    })
    expect(result).toBe('// end of file')
  })

  it('calls output.footer function with meta when meta is provided', () => {
    const meta: InputMeta = { title: 'Petstore', circularNames: [], enumNames: [] }
    const result = defaultResolveFooter(meta, {
      config: mockConfig,
      output: { footer: (m?: InputMeta) => `// footer for ${m?.title}` },
    })
    expect(result).toBe('// footer for Petstore')
  })

  it('calls output.footer function with undefined when meta is undefined', () => {
    const result = defaultResolveFooter(undefined, {
      config: mockConfig,
      output: { footer: (_m?: InputMeta) => '// called' },
    })
    expect(result).toBe('// called')
  })

  it('function footer receives per-file context', () => {
    const result = defaultResolveFooter(undefined, {
      config: mockConfig,
      output: { footer: (m) => (m.isBarrel ? '// barrel' : `// ${m.baseName}`) },
      file: { path: 'src/gen/index.ts', baseName: 'index.ts', isBarrel: true },
    })
    expect(result).toBe('// barrel')
  })
})
