import { camelCase } from '@internals/utils'
import { ast, type InputMeta } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { createResolver } from './createResolver.ts'
import { Resolver } from './Resolver.ts'
import type { Config } from './types.ts'

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

const baseResolver = new Resolver({ pluginName: 'test' })

const context = {
  root: '/root',
  output: { path: 'types' as const },
  group: undefined,
}

describe('createResolver', () => {
  it('injects the default machinery and top-level name/file', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      greet(name) {
        return `Hello ${name}`
      },
      farewell(name) {
        return `Goodbye ${name}`
      },
    })

    expect(resolver.default.name).toBeTypeOf('function')
    expect(resolver.default.options).toBeTypeOf('function')
    expect(resolver.default.path).toBeTypeOf('function')
    expect(resolver.default.file).toBeTypeOf('function')
    expect(resolver.name).toBeTypeOf('function')
    expect(resolver.file).toBeTypeOf('function')
    // the injected top-level name delegates to the built-in camelCase default
    expect(resolver.name('list pets')).toBe('listPets')
    expect(resolver).toBeInstanceOf(Resolver)
  })

  it('a plugin overrides the top-level name; default.name keeps the built-in casing', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      name(name) {
        return name.toUpperCase()
      },
      greet(name) {
        return this.name(name)
      },
      farewell(name) {
        return `bye ${this.name(name)}`
      },
    })

    expect(resolver.name('hello')).toBe('HELLO')
    expect(resolver.greet('world')).toBe('WORLD')
    expect(resolver.default.name('list pets')).toBe('listPets')
  })

  it('a namespace method reaches the resolver root through `this`', () => {
    type SchemaResolver = Resolver & { schema: { name(name: string): string; typeName(name: string): string } }
    type SchemaFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: SchemaResolver }

    const resolver = createResolver<SchemaFactory>({
      pluginName: 'test',
      schema: {
        name(name) {
          return `${this.name(name)}Schema`
        },
        typeName(name) {
          return `${this.name(name)}SchemaType`
        },
      },
    })

    expect(resolver.schema.name('list pets')).toBe('listPetsSchema')
    expect(resolver.schema.typeName('list pets')).toBe('listPetsSchemaType')
  })

  it('a file renames the base name via file.baseName', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      file: {
        baseName({ name, extname }) {
          return `${name.toLowerCase()}.gen${extname}`
        },
      },
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    const file = resolver.file({ name: 'Pet', extname: '.ts', ...context })
    expect(file.baseName).toBe('pet.gen.ts')
  })

  it('a file reaches sibling helpers through `this`', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      name(name) {
        return name.toUpperCase()
      },
      file: {
        baseName({ name, extname }) {
          return `${this.name(name)}.schema${extname}`
        },
      },
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    expect(resolver.file({ name: 'pet', extname: '.ts', ...context }).baseName).toBe('PET.schema.ts')
  })

  it('Resolver.merge accepts a file patch', () => {
    const base = createResolver<TestPluginFactory>({
      pluginName: 'test',
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    const merged = Resolver.merge(base, {
      file: {
        baseName({ name, extname }) {
          return `${name}.mock${extname}`
        },
      },
    })

    expect(merged.file({ name: 'pet', extname: '.ts', ...context }).baseName).toBe('pet.mock.ts')
  })

  it('a file.path owns the whole path, resolved against root and bypassing output.path', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      file: {
        path({ baseName }) {
          return `mocks/${baseName}`
        },
      },
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    const file = resolver.file({ name: 'pet', extname: '.ts', ...context })
    expect(file.path).toBe('/root/mocks/pet.ts')
    expect(file.baseName).toBe('pet.ts')
  })

  it('a file.path reaches the resolver through `this`', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      file: {
        path({ baseName, output }) {
          return `${output.path}/${this.pluginName}/${baseName}`
        },
      },
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    expect(resolver.file({ name: 'pet', extname: '.ts', ...context }).path).toBe('/root/types/test/pet.ts')
  })

  it('file.path receives the base name from file.baseName', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      file: {
        baseName({ name, extname }) {
          return `${name}.gen${extname}`
        },
        path({ baseName }) {
          return `custom/${baseName}`
        },
      },
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    const file = resolver.file({ name: 'pet', extname: '.ts', ...context })
    expect(file.path).toBe('/root/custom/pet.gen.ts')
    expect(file.baseName).toBe('pet.gen.ts')
  })

  it('a file.path that escapes the project root throws', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      file: {
        path() {
          return '../outside/pet.ts'
        },
      },
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    expect(() => resolver.file({ name: 'pet', extname: '.ts', ...context })).toThrow('outside the project root')
  })

  it('resolveOptions does not throw when options is not an object', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })

    const node = ast.factory.createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })

    // A re-instantiated plugin can hand back a falsy-but-not-nullish `options` (e.g. `false`).
    // `resolveOptions` caches by `options` identity in a `WeakMap`, which only accepts object
    // keys, so this must fall back to computing directly instead of throwing.
    expect(() => resolver.default.options<boolean>(node, { options: false })).not.toThrow()
    expect(resolver.default.options<boolean>(node, { options: false })).toBe(false)
  })

  it('Resolver.merge() rebuilds helpers on a new instance', () => {
    type SchemaResolver = Resolver & { schema: { label(name: string): string } }
    type SchemaFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: SchemaResolver }

    const base = createResolver<SchemaFactory>({
      pluginName: 'test',
      schema: {
        label(name) {
          return `base:${this.name(name)}`
        },
      },
    })

    const merged = Resolver.merge(base, {
      name(name) {
        return name.toUpperCase()
      },
    })

    expect(merged).not.toBe(base)
    expect(merged).toBeInstanceOf(Resolver)
    expect(merged.name('hello')).toBe('HELLO')
    expect(merged.schema.label('pets')).toBe('base:PETS')
  })

  it('Resolver.merge() overrides one namespace method and keeps the siblings', () => {
    type QueryResolver = Resolver & {
      query: {
        name(node: { operationId: string }): string
        keyName(node: { operationId: string }): string
      }
    }
    type QueryFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: QueryResolver }

    const base = createResolver<QueryFactory>({
      pluginName: 'test',
      query: {
        name(node) {
          return this.name(node.operationId)
        },
        keyName(node) {
          return `${this.name(node.operationId)}Key`
        },
      },
    })

    const merged = Resolver.merge(base, {
      query: {
        name(node) {
          return `use_${this.name(node.operationId)}`
        },
      },
    })

    expect(merged.query.name({ operationId: 'get pet' })).toBe('use_getPet')
    expect(merged.query.keyName({ operationId: 'get pet' })).toBe('getPetKey')
  })

  it('supports top-level helpers like typeName', () => {
    type TypeResolver = Resolver & { typeName(name: string): string }
    type TypeFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: TypeResolver }

    const resolver = createResolver<TypeFactory>({
      pluginName: 'test',
      typeName(name) {
        return `${this.name(name)}Type`
      },
    })

    expect(resolver.typeName('list pets')).toBe('listPetsType')
  })
})

describe('default.path', () => {
  it('resolves flat path (directory mode)', () => {
    const result = baseResolver.default.path({ baseName: 'petTypes.ts', root: '/root', output: { path: 'types' }, group: undefined })

    expect(result).toBe('/root/types/petTypes.ts')
  })

  it('returns the output file as-is in file mode', () => {
    const result = baseResolver.default.path({ baseName: 'petTypes.ts', root: '/root', output: { path: 'types.ts', mode: 'file' }, group: undefined })

    expect(result).toBe('/root/types.ts')
  })

  it('groups by tag using the plain camelCased tag by default', () => {
    const result = baseResolver.default.path({
      baseName: 'petTypes.ts',
      tag: 'pet store',
      root: '/root',
      output: { path: 'types' },
      group: { type: 'tag' },
    })

    expect(result).toBe('/root/types/petStore/petTypes.ts')
  })

  it('groups by path when group.type is path', () => {
    const result = baseResolver.default.path({
      baseName: 'petTypes.ts',
      path: '/pets/list',
      root: '/root',
      output: { path: 'types' },
      group: {
        type: 'path',
        name: (ctx: { group: string }) => {
          return `${camelCase(ctx.group)}Controller`
        },
      },
    })

    expect(result).toBe('/root/types/petsListController/petTypes.ts')
  })

  it('uses custom group.name when provided', () => {
    const result = baseResolver.default.path({
      baseName: 'petTypes.ts',
      tag: 'pets',
      root: '/root',
      output: { path: 'types' },
      group: { type: 'tag', name: ({ group }) => `custom_${group}` },
    })

    expect(result).toBe('/root/types/custom_pets/petTypes.ts')
  })

  it('falls back to flat path when group present but no tag or path given', () => {
    const result = baseResolver.default.path({
      baseName: 'petTypes.ts',
      tag: 'pets',
      root: '/root',
      output: { path: 'types' },
      group: {
        type: 'tag',
        name: (ctx: { group: string }) => {
          return `${camelCase(ctx.group)}Controller`
        },
      },
    })

    expect(result).toBe('/root/types/petsController/petTypes.ts')
  })

  it('sanitizes traversal segments in default path-based grouping', () => {
    const result = baseResolver.default.path({
      baseName: 'petTypes.ts',
      path: '../../etc/passwd',
      root: '/root',
      output: { path: 'types' },
      group: { type: 'path' },
    })

    // Traversal components (..) are stripped; first valid segment ('etc') is used as the directory
    expect(result).toBe('/root/types/etc/petTypes.ts')
    // Verify traversal did not escape the output directory
    expect(result).toContain('/root/types/')
    expect(result).not.toContain('..')
  })

  it('throws when a custom group.name returns a path outside the output directory', () => {
    expect(() =>
      baseResolver.default.path({
        baseName: 'petTypes.ts',
        path: '/pets',
        root: '/root',
        output: { path: 'types' },
        group: { type: 'path', name: () => '../../secrets' },
      }),
    ).toThrow('outside the output directory')
  })

  it('throws when baseName contains a traversal sequence', () => {
    expect(() => baseResolver.default.path({ baseName: '../../etc/passwd', root: '/root', output: { path: 'types' }, group: undefined })).toThrow(
      'outside the output directory',
    )
  })
})

describe('default.file', () => {
  const resolver = createResolver<TestPluginFactory>({
    pluginName: 'test',
    greet: () => '',
    farewell: () => '',
  })

  it('resolves a file with correct baseName and path', () => {
    const file = resolver.default.file({ name: 'pet', extname: '.ts', ...context })

    expect(file.baseName).toBe('pet.ts')
    expect(file.path).toBe('/root/types/pet.ts')
    expect(file.sources).toStrictEqual([])
    expect(file.imports).toStrictEqual([])
    expect(file.exports).toStrictEqual([])
  })

  it('uses the default toFilePath casing for the file name', () => {
    const file = resolver.default.file({ name: 'list pets', extname: '.ts', ...context })

    expect(file.baseName).toBe('listPets.ts')
  })

  it.each([
    // dots before a letter split into nested directories
    ['pet.petId', '/root/types/pet/petId.ts'],
    ['api.v2', '/root/types/api/v2.ts'],
    // version numbers (dot before a digit) stay in one segment
    ['some_operation_v3.14', '/root/types/someOperationV314.ts'],
    // leading dots must not escape the output directory
    ['..Schema', '/root/types/schema.ts'],
  ])('nests dotted file name %s into %s', (name, expected) => {
    const file = resolver.default.file({ name, extname: '.ts', ...context })

    expect(file.path).toBe(expected)
  })

  it('omits the file name and writes to the output file in file mode', () => {
    const file = resolver.default.file({
      name: 'pet',
      extname: '.ts',
      ...context,
      output: {
        ...context.output,
        path: 'types.ts' as const,
        mode: 'file' as const,
      },
    })

    expect(file.path).toBe('/root/types.ts')
    expect(file.baseName).toBe('types.ts')
  })

  it('groups by tag when resolver is tag-grouped', () => {
    const file = resolver.default.file({
      name: 'pet',
      extname: '.ts',
      tag: 'pets',
      root: '/root',
      output: { path: 'types' },
      group: { type: 'tag' },
    })

    expect(file.path).toBe('/root/types/pets/pet.ts')
  })
})

const mockConfig = {
  input: { path: 'petStore.yaml' },
  output: { path: 'src/generated', defaultBanner: true },
} as unknown as Config

describe('default.banner', () => {
  it('returns default banner when no output.banner is configured', () => {
    const result = baseResolver.default.banner(undefined, { config: mockConfig })
    expect(result).toContain('Generated by Kubb')
    expect(result).toContain('petStore.yaml')
  })

  it('returns simple banner when defaultBanner is "simple"', () => {
    const config = {
      ...mockConfig,
      output: { ...mockConfig.output, defaultBanner: 'simple' },
    } as unknown as Config
    const result = baseResolver.default.banner(undefined, { config })
    expect(result).toBe('/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n*/\n')
  })

  it('returns null when defaultBanner is false and no user banner', () => {
    const config = {
      ...mockConfig,
      output: { ...mockConfig.output, defaultBanner: false },
    } as unknown as Config
    const result = baseResolver.default.banner(undefined, { config })
    expect(result).toBeNull()
  })

  it('user string banner overrides the Kubb default', () => {
    const result = baseResolver.default.banner(undefined, {
      config: mockConfig,
      output: { banner: '// custom banner' },
    })
    expect(result).toBe('// custom banner')
  })

  it('user function banner overrides the Kubb default when meta is provided', () => {
    const meta: InputMeta = { title: 'Petstore', description: 'Test API', version: '1.0.0', circularNames: [], enumNames: [] }
    const result = baseResolver.default.banner(meta, {
      config: mockConfig,
      output: { banner: (m?: InputMeta) => `// title: ${m?.title}` },
    })
    expect(result).toBe('// title: Petstore')
  })

  it('includes meta title and version (but not description) in the Kubb banner when meta is provided', () => {
    const meta: InputMeta = { title: 'Pet API', description: 'A very long description', version: '2.0.0', circularNames: [], enumNames: [] }
    const result = baseResolver.default.banner(meta, {
      config: mockConfig,
    })
    expect(result).toContain('Pet API')
    expect(result).toContain('2.0.0')
    expect(result).not.toContain('A very long description')
  })

  it('function banner receives per-file context and can skip aggregation files', () => {
    const banner = (m: { isBarrel: boolean; isAggregation: boolean }) => (m.isBarrel || m.isAggregation ? '' : "'use server'")

    const aggregation = baseResolver.default.banner(undefined, {
      config: mockConfig,
      output: { banner },
      file: { path: 'src/gen/clients/stocks/stocks.ts', baseName: 'stocks.ts', isAggregation: true },
    })
    const barrel = baseResolver.default.banner(undefined, {
      config: mockConfig,
      output: { banner },
      file: { path: 'src/gen/clients/index.ts', baseName: 'index.ts', isBarrel: true },
    })
    const source = baseResolver.default.banner(undefined, {
      config: mockConfig,
      output: { banner },
      file: { path: 'src/gen/clients/getStock.ts', baseName: 'getStock.ts' },
    })

    expect(aggregation).toBe('')
    expect(barrel).toBe('')
    expect(source).toBe("'use server'")
  })

  it('function banner receives filePath and baseName from the file context', () => {
    const result = baseResolver.default.banner(undefined, {
      config: mockConfig,
      output: { banner: (m) => `// ${m.baseName} @ ${m.filePath}` },
      file: { path: 'a/b.ts', baseName: 'b.ts' },
    })
    expect(result).toBe('// b.ts @ a/b.ts')
  })

  it('per-file fields default to false/empty when no file context is provided', () => {
    const result = baseResolver.default.banner(undefined, {
      config: mockConfig,
      output: { banner: (m) => `${m.isBarrel}-${m.isAggregation}-[${m.filePath}]-[${m.baseName}]` },
    })
    expect(result).toBe('false-false-[]-[]')
  })
})

describe('default.footer', () => {
  it('returns null when no output.footer is configured', () => {
    const result = baseResolver.default.footer(undefined, { config: mockConfig })
    expect(result).toBeNull()
  })

  it('returns static string footer from output.footer', () => {
    const result = baseResolver.default.footer(undefined, {
      config: mockConfig,
      output: { footer: '// end of file' },
    })
    expect(result).toBe('// end of file')
  })

  it('calls output.footer function with meta when meta is provided', () => {
    const meta: InputMeta = { title: 'Petstore', circularNames: [], enumNames: [] }
    const result = baseResolver.default.footer(meta, {
      config: mockConfig,
      output: { footer: (m?: InputMeta) => `// footer for ${m?.title}` },
    })
    expect(result).toBe('// footer for Petstore')
  })

  it('calls output.footer function with undefined when meta is undefined', () => {
    const result = baseResolver.default.footer(undefined, {
      config: mockConfig,
      output: { footer: (_m?: InputMeta) => '// called' },
    })
    expect(result).toBe('// called')
  })

  it('function footer receives per-file context', () => {
    const result = baseResolver.default.footer(undefined, {
      config: mockConfig,
      output: { footer: (m) => (m.isBarrel ? '// barrel' : `// ${m.baseName}`) },
      file: { path: 'src/gen/index.ts', baseName: 'index.ts', isBarrel: true },
    })
    expect(result).toBe('// barrel')
  })
})
