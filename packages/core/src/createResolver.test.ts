import { camelCase } from '@internals/utils'
import { ast, type InputMeta } from '@kubb/ast'
import { describe, expect, it, test } from 'vitest'
import { createResolver } from './createResolver.ts'
import { Resolver, toFilePath } from './Resolver.ts'
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
  output: { path: 'types' as const, mode: 'directory' as const },
  group: undefined,
}

describe('createResolver', () => {
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

  it('returns the base name from file.baseName, which reaches sibling helpers through `this`', () => {
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

  it('Resolver.merge accepts file and imports patches without a cast', () => {
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
      imports: () => [],
    })

    expect(merged.file({ name: 'pet', extname: '.ts', ...context }).baseName).toBe('pet.mock.ts')
    expect(merged.imports({ node: ast.factory.createSchema({ type: 'string' }), ...context })).toStrictEqual([])
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

  it('returns false from default.options when options is false', () => {
    const resolver = createResolver<TestPluginFactory>({
      pluginName: 'test',
      greet: (name: string) => name,
      farewell: (name: string) => name,
    })
    const node = ast.factory.createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })

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

  it('Resolver.merge() folds multiple overrides left to right, last wins per key', () => {
    type NameResolver = Resolver & { greet(name: string): string }
    type NameFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: NameResolver }

    const base = createResolver<NameFactory>({
      pluginName: 'test',
      greet(name) {
        return `base:${name}`
      },
    })

    const merged = Resolver.merge(
      base,
      {
        greet(name) {
          return `first:${name}`
        },
      },
      {
        greet(name) {
          return `second:${name}`
        },
      },
    )

    expect(merged.greet('pet')).toBe('second:pet')
  })

  it('Resolver.merge() merges a namespace per method across several overrides', () => {
    type MutationResolver = Resolver & {
      mutation: {
        name(node: { operationId: string }): string
        keyName(node: { operationId: string }): string
        typeName(node: { operationId: string }): string
      }
    }
    type MutationFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: MutationResolver }

    const base = createResolver<MutationFactory>({
      pluginName: 'test',
      mutation: {
        name(node) {
          return this.name(node.operationId)
        },
        keyName(node) {
          return `${this.name(node.operationId)}MutationKey`
        },
        typeName(node) {
          return this.name(node.operationId)
        },
      },
    })

    const merged = Resolver.merge(
      base,
      {
        mutation: {
          name(node) {
            return `use_${this.name(node.operationId)}`
          },
        },
      },
      {
        mutation: {
          typeName(node) {
            return `${this.name(node.operationId)}Type`
          },
        },
      },
    )

    expect(merged.mutation.name({ operationId: 'update pet' })).toBe('use_updatePet')
    expect(merged.mutation.keyName({ operationId: 'update pet' })).toBe('updatePetMutationKey')
    expect(merged.mutation.typeName({ operationId: 'update pet' })).toBe('updatePetType')
  })

  it('Resolver.merge() keeps a file override from a resolver in another @kubb/core copy, anywhere in the fold', () => {
    type TestFactory = { name: 'test'; options: {}; resolvedOptions: {}; resolver: Resolver }
    const base = createResolver<TestFactory>({ pluginName: 'test' })

    // A resolver loaded from a second @kubb/core copy (a CommonJS config next to the ESM CLI) is not
    // `instanceof Resolver`, but shares the brand, so its `file` override must still be honored.
    const foreign = {
      [Symbol.for('@kubb/core/resolver/options')]: {
        pluginName: 'test',
        file: { baseName: ({ name, extname }: { name: string; extname: string }) => `${name}Faker${extname}` },
      },
    } as unknown as Resolver

    const merged = Resolver.merge(base, foreign, {
      name(name) {
        return name.toUpperCase()
      },
    })

    expect(merged.name('pet')).toBe('PET')
    expect(merged.file({ name: 'pet', extname: '.ts', ...context }).baseName).toBe('petFaker.ts')
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
  it.each([
    ['the output directory in directory mode', { output: { path: 'types', mode: 'directory' } }, '/root/types/petTypes.ts'],
    ['the output file as-is in file mode', { output: { path: 'types.ts', mode: 'file' } }, '/root/types.ts'],
    ['a camelCased tag directory for a tag group', { tag: 'pet store', group: { type: 'tag' } }, '/root/types/petStore/petTypes.ts'],
    [
      'the custom group.name for a tag group',
      { tag: 'pets', group: { type: 'tag', name: ({ group }) => `custom_${group}` } },
      '/root/types/custom_pets/petTypes.ts',
    ],
    [
      'the custom group.name for a path group',
      { path: '/pets/list', group: { type: 'path', name: ({ group }) => `${camelCase(group)}Controller` } },
      '/root/types/petsListController/petTypes.ts',
    ],
  ] satisfies Array<[string, Partial<Parameters<typeof baseResolver.default.path>[0]>, string]>)('returns %s', (_name, params, expected) => {
    expect(
      baseResolver.default.path({ baseName: 'petTypes.ts', root: '/root', output: { path: 'types', mode: 'directory' }, group: undefined, ...params }),
    ).toBe(expected)
  })

  it('sanitizes traversal segments in default path-based grouping', () => {
    const result = baseResolver.default.path({
      baseName: 'petTypes.ts',
      path: '../../etc/passwd',
      root: '/root',
      output: { path: 'types', mode: 'directory' },
      group: { type: 'path' },
    })

    // Traversal components (..) are stripped; first valid segment ('etc') is used as the directory
    expect(result).toBe('/root/types/etc/petTypes.ts')
    // Verify traversal did not escape the output directory
    expect(result).toContain('/root/types/')
    expect(result).not.toContain('..')
  })

  it.each([
    [
      'a custom group.name returns a path outside the output directory',
      { baseName: 'petTypes.ts', path: '/pets', group: { type: 'path', name: () => '../../secrets' } },
    ],
    ['baseName contains a traversal sequence', { baseName: '../../etc/passwd' }],
  ] satisfies Array<[string, Pick<Parameters<typeof baseResolver.default.path>[0], 'baseName' | 'path' | 'group'>]>)('throws when %s', (_name, params) => {
    expect(() => baseResolver.default.path({ root: '/root', output: { path: 'types', mode: 'directory' }, group: undefined, ...params })).toThrow(
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

  it('returns an empty file at the camelCased name under the output directory', () => {
    const file = resolver.default.file({ name: 'list pets', extname: '.ts', ...context })

    expect(file).toMatchObject({ baseName: 'listPets.ts', path: '/root/types/listPets.ts', sources: [], imports: [], exports: [] })
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
      output: { path: 'types', mode: 'directory' },
      group: { type: 'tag' },
    })

    expect(file.path).toBe('/root/types/pets/pet.ts')
  })
})

describe('resolver.imports', () => {
  const refNode = ast.factory.createSchema({
    type: 'object',
    properties: [
      ast.factory.createProperty({ name: 'pet', schema: ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Pet', name: 'Pet' }) }),
      ast.factory.createProperty({ name: 'order', schema: ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Order', name: 'Order' }) }),
    ],
  })

  it('builds one import per ref with the resolver name and file path', () => {
    const imports = baseResolver.imports({ node: refNode, ...context })

    expect(imports).toMatchObject([
      { kind: 'Import', name: ['pet'], path: '/root/types/pet.ts' },
      { kind: 'Import', name: ['order'], path: '/root/types/order.ts' },
    ])
  })

  it('resolves a collision-renamed ref through targetName', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({
          name: 'order',
          schema: ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Order', name: 'Order', targetName: 'OrderSchema' }),
        }),
      ],
    })

    const imports = baseResolver.imports({ node, ...context })

    expect(imports).toMatchObject([{ kind: 'Import', name: ['orderSchema'], path: '/root/types/orderSchema.ts' }])
  })

  it('a per-call name override wins over the resolver name', () => {
    const imports = baseResolver.imports({
      node: refNode,
      ...context,
      name: (schemaName) => `${schemaName}Type`,
    })

    expect(imports.map((imp) => imp.name)).toStrictEqual([['PetType'], ['OrderType']])
  })

  it('emits one import per unique target when a schema is referenced repeatedly', () => {
    const petRef = () => ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Pet', name: 'Pet' })
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'first', schema: petRef() }), ast.factory.createProperty({ name: 'second', schema: petRef() })],
    })

    expect(baseResolver.imports({ node, ...context })).toMatchObject([{ name: ['pet'], path: '/root/types/pet.ts' }])
  })
})

const mockConfig = {
  input: 'petStore.yaml',
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

  it('includes meta title and version (but not description) in the Kubb banner when meta is provided', () => {
    const meta: InputMeta = { title: 'Pet API', description: 'A very long description', version: '2.0.0', circularNames: [], enumNames: [] }
    const result = baseResolver.default.banner(meta, {
      config: mockConfig,
    })
    expect(result).toContain('Pet API')
    expect(result).toContain('2.0.0')
    expect(result).not.toContain('A very long description')
  })
})

describe('default.footer', () => {
  it('returns null when no output.footer is configured', () => {
    const result = baseResolver.default.footer(undefined, { config: mockConfig })
    expect(result).toBeNull()
  })
})

// banner and footer share one user-text path: a string wins verbatim, and a function receives the
// spec meta plus the per-file context, with the per-file fields defaulting to false/empty.
describe('default.banner / default.footer user text', () => {
  const meta: InputMeta = { title: 'Petstore', description: 'Test API', version: '1.0.0', circularNames: [], enumNames: [] }
  const describeFile = (m: { title?: string; isBarrel: boolean; isAggregation: boolean; filePath: string; baseName: string }) =>
    `${m.title ?? ''}|${m.isBarrel}|${m.isAggregation}|${m.filePath}|${m.baseName}`

  it.each(['banner', 'footer'] as const)('returns the user string %s verbatim', (method) => {
    expect(baseResolver.default[method](undefined, { config: mockConfig, output: { [method]: '// custom' } })).toBe('// custom')
  })

  it.each([
    ['banner', meta, undefined, 'Petstore|false|false||'],
    [
      'banner',
      undefined,
      { path: 'src/gen/clients/stocks/stocks.ts', baseName: 'stocks.ts', isAggregation: true },
      '|false|true|src/gen/clients/stocks/stocks.ts|stocks.ts',
    ],
    ['banner', undefined, { path: 'src/gen/clients/index.ts', baseName: 'index.ts', isBarrel: true }, '|true|false|src/gen/clients/index.ts|index.ts'],
    ['banner', undefined, { path: 'src/gen/clients/getStock.ts', baseName: 'getStock.ts' }, '|false|false|src/gen/clients/getStock.ts|getStock.ts'],
    ['footer', meta, undefined, 'Petstore|false|false||'],
    ['footer', undefined, undefined, '|false|false||'],
    ['footer', undefined, { path: 'src/gen/index.ts', baseName: 'index.ts', isBarrel: true }, '|true|false|src/gen/index.ts|index.ts'],
  ] satisfies Array<
    ['banner' | 'footer', InputMeta | undefined, { path: string; baseName: string; isBarrel?: boolean; isAggregation?: boolean } | undefined, string]
  >)('calls the user %s function with meta %o and file %o', (method, inputMeta, file, expected) => {
    expect(baseResolver.default[method](inputMeta, { config: mockConfig, output: { [method]: describeFile }, file })).toBe(expected)
  })
})

describe('toFilePath', () => {
  test.each([
    // version numbers (dot before a digit) stay in one segment
    ['get_enterprise_configurations_id_v2025.0', 'getEnterpriseConfigurationsIdV20250'],
    ['some_operation_v3.14', 'someOperationV314'],
    ['version.1.2.3', 'version123'],
    // dots before a letter split into nested path segments
    ['pet.petId', 'pet/petId'],
    ['pet.Pet', 'pet/pet'],
    ['api.v2', 'api/v2'],
    // Security: leading dots must NOT produce a leading slash (path traversal guard)
    ['..Schema', 'schema'],
    ['...Schema', 'schema'],
    ['.Internal', 'internal'],
  ])('toFilePath(%s) -> %s (camelCase segments)', (input, expected) => {
    expect(toFilePath(input)).toBe(expected)
  })
})
