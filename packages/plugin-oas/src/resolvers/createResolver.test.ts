import { describe, expect, it } from 'vitest'
import { buildResolverContext, createResolver, executeResolvers, mergeResolvers } from './createResolver.ts'
import type { ResolverContext } from './types.ts'

type TestOutputKeys = 'hook' | 'type'

describe('createResolver', () => {
  it('should create a resolver with correct types', () => {
    const resolver = createResolver<TestOutputKeys>({
      name: 'test-resolver',
      resolve: ({ operationId }) => ({
        file: { baseName: `${operationId}.ts`, path: `test/${operationId}.ts` },
        outputs: {
          hook: { name: `use${operationId}` },
          type: { name: `${operationId}Type` },
        },
      }),
    })

    expect(resolver.name).toBe('test-resolver')
    expect(typeof resolver.resolve).toBe('function')
  })
})

describe('executeResolvers', () => {
  const mockContext: ResolverContext = {
    oas: {} as any,
    operationId: 'getPet',
    tags: ['pets'],
    path: '/pets/{petId}',
    method: 'get',
  }

  it('should execute first matching resolver', () => {
    const resolvers = [
      createResolver<TestOutputKeys>({
        name: 'first',
        match: () => false,
        resolve: () => ({
          file: { baseName: 'first.ts', path: 'first.ts' },
          outputs: { hook: { name: 'first' }, type: { name: 'First' } },
        }),
      }),
      createResolver<TestOutputKeys>({
        name: 'second',
        resolve: () => ({
          file: { baseName: 'second.ts', path: 'second.ts' },
          outputs: { hook: { name: 'second' }, type: { name: 'Second' } },
        }),
      }),
    ]

    const result = executeResolvers(resolvers, mockContext)

    expect(result).not.toBeNull()
    expect(result?.file.baseName).toBe('second.ts')
    expect(result?.outputs.hook.name).toBe('second')
  })

  it('should return null if no resolver matches', () => {
    const resolvers = [
      createResolver<TestOutputKeys>({
        name: 'never-matches',
        match: () => false,
        resolve: () => ({
          file: { baseName: 'never.ts', path: 'never.ts' },
          outputs: { hook: { name: 'never' }, type: { name: 'Never' } },
        }),
      }),
    ]

    const result = executeResolvers(resolvers, mockContext)

    expect(result).toBeNull()
  })

  it('should match resolver without match function', () => {
    const resolvers = [
      createResolver<TestOutputKeys>({
        name: 'always-matches',
        resolve: () => ({
          file: { baseName: 'always.ts', path: 'always.ts' },
          outputs: { hook: { name: 'always' }, type: { name: 'Always' } },
        }),
      }),
    ]

    const result = executeResolvers(resolvers, mockContext)

    expect(result).not.toBeNull()
    expect(result?.outputs.hook.name).toBe('always')
  })

  it('should support conditional matching based on path', () => {
    const adminContext: ResolverContext = {
      ...mockContext,
      path: '/admin/users',
    }

    const resolvers = [
      createResolver<TestOutputKeys>({
        name: 'admin-resolver',
        match: (ctx) => ctx.path?.startsWith('/admin') ?? false,
        resolve: () => ({
          file: { baseName: 'admin.ts', path: 'admin.ts' },
          outputs: { hook: { name: 'adminHook' }, type: { name: 'AdminType' } },
        }),
      }),
      createResolver<TestOutputKeys>({
        name: 'default-resolver',
        resolve: () => ({
          file: { baseName: 'default.ts', path: 'default.ts' },
          outputs: { hook: { name: 'defaultHook' }, type: { name: 'DefaultType' } },
        }),
      }),
    ]

    const adminResult = executeResolvers(resolvers, adminContext)
    const normalResult = executeResolvers(resolvers, mockContext)

    expect(adminResult?.outputs.hook.name).toBe('adminHook')
    expect(normalResult?.outputs.hook.name).toBe('defaultHook')
  })
})

describe('mergeResolvers', () => {
  it('should put custom resolvers before defaults', () => {
    const custom = [
      createResolver<TestOutputKeys>({
        name: 'custom',
        resolve: () => ({
          file: { baseName: 'custom.ts', path: 'custom.ts' },
          outputs: { hook: { name: 'custom' }, type: { name: 'Custom' } },
        }),
      }),
    ]

    const defaults = [
      createResolver<TestOutputKeys>({
        name: 'default',
        resolve: () => ({
          file: { baseName: 'default.ts', path: 'default.ts' },
          outputs: { hook: { name: 'default' }, type: { name: 'Default' } },
        }),
      }),
    ]

    const merged = mergeResolvers(custom, defaults)

    expect(merged).toHaveLength(2)
    expect(merged[0]?.name).toBe('custom')
    expect(merged[1]?.name).toBe('default')
  })

  it('should handle undefined custom resolvers', () => {
    const defaults = [
      createResolver<TestOutputKeys>({
        name: 'default',
        resolve: () => ({
          file: { baseName: 'default.ts', path: 'default.ts' },
          outputs: { hook: { name: 'default' }, type: { name: 'Default' } },
        }),
      }),
    ]

    const merged = mergeResolvers(undefined, defaults)

    expect(merged).toHaveLength(1)
    expect(merged[0]?.name).toBe('default')
  })
})

describe('buildResolverContext', () => {
  it('should build context from operation', () => {
    const mockOperation = {
      getOperationId: () => 'getPetById',
      getTags: () => [{ name: 'pets' }],
      path: '/pets/{petId}',
      method: 'get',
    } as any

    const mockOas = {} as any

    const ctx = buildResolverContext(mockOas, mockOperation)

    expect(ctx.operationId).toBe('getPetById')
    expect(ctx.tags).toEqual(['pets'])
    expect(ctx.path).toBe('/pets/{petId}')
    expect(ctx.method).toBe('get')
    expect(ctx.operation).toBe(mockOperation)
    expect(ctx.oas).toBe(mockOas)
  })

  it('should build context from schema', () => {
    const mockSchema = { name: 'Pet', value: { type: 'object' } } as any
    const mockOas = {} as any

    const ctx = buildResolverContext(mockOas, undefined, mockSchema)

    expect(ctx.schema).toBe(mockSchema)
    expect(ctx.oas).toBe(mockOas)
    expect(ctx.operationId).toBeUndefined()
  })

  it('should build minimal context with just oas', () => {
    const mockOas = {} as any

    const ctx = buildResolverContext(mockOas)

    expect(ctx.oas).toBe(mockOas)
    expect(ctx.operation).toBeUndefined()
    expect(ctx.schema).toBeUndefined()
  })
})

describe('output file override', () => {
  it('should support different files for different outputs', () => {
    const resolver = createResolver<'hook' | 'queryKeyType'>({
      name: 'with-separate-types',
      resolve: ({ operationId }) => ({
        file: { baseName: `use${operationId}.ts`, path: `hooks/use${operationId}.ts` },
        outputs: {
          hook: { name: `use${operationId}` },
          queryKeyType: {
            name: `${operationId}QueryKey`,
            file: { baseName: 'types.ts', path: 'hooks/types.ts' },
          },
        },
      }),
    })

    const ctx: ResolverContext = { oas: {} as any, operationId: 'getPet' }
    const result = resolver.resolve(ctx)

    // Hook uses default file
    expect(result.outputs.hook.file).toBeUndefined()

    // QueryKeyType has its own file
    expect(result.outputs.queryKeyType.file?.baseName).toBe('types.ts')
    expect(result.outputs.queryKeyType.file?.path).toBe('hooks/types.ts')
  })
})
