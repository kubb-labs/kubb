import type { Config, PluginFactoryOptions } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation, SchemaObject } from '@kubb/oas'
import { describe, expect, it } from 'vitest'
import { createResolver, executeResolvers, mergeResolvers } from './createResolver.ts'
import type { OperationResolverContext, SchemaResolverContext } from './types.ts'

// Helper to create a minimal file object for tests
const createFile = (baseName: KubbFile.File['baseName'], path: string): KubbFile.File => ({
  baseName,
  path,
  imports: [],
  exports: [],
  sources: [],
  meta: {},
})

// Mock data
const mockOperation = {
  getOperationId: () => 'getPetById',
  getTags: () => [{ name: 'pet' }],
  path: '/pets/{petId}',
  method: 'get' as const,
} as unknown as Operation

const mockSchema: { name: string; value: SchemaObject } = {
  name: 'Pet',
  value: { type: 'object' },
}

const mockConfig = {
  root: '.',
  output: { path: 'src/gen' },
} as Config

// Define a test options type
type TestOptions = PluginFactoryOptions<
  'test-plugin',
  any,
  any,
  any,
  any,
  { operation: 'response' | 'request'; schema: 'type' }
>

describe('createResolver', () => {
  it('should create a resolver with operation handler', () => {
    const resolver = createResolver<TestOptions>({
      name: 'test-resolver',
      operation: () => ({
        file: createFile('test.ts', 'types/test.ts'),
        outputs: {
          default: { name: 'Test' },
          response: { name: 'TestResponse' },
          request: { name: 'TestRequest' },
        },
      }),
    })

    expect(resolver.name).toBe('test-resolver')
    expect(typeof resolver.operation).toBe('function')
  })
})

describe('mergeResolvers', () => {
  it('should merge custom resolvers with defaults (custom first)', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const customResolver = createResolver<ResponseOptions>({
      name: 'custom',
      operation: () => ({
        file: createFile('custom.ts', 'custom.ts'),
        outputs: { default: { name: 'Custom' }, response: { name: 'Custom' } },
      }),
    })

    const defaultResolver = createResolver<ResponseOptions>({
      name: 'default',
      operation: () => ({
        file: createFile('default.ts', 'default.ts'),
        outputs: { default: { name: 'Default' }, response: { name: 'Default' } },
      }),
    })

    const merged = mergeResolvers([customResolver], [defaultResolver])

    expect(merged).toHaveLength(2)
    expect(merged[0]?.name).toBe('custom')
    expect(merged[1]?.name).toBe('default')
  })

  it('should handle undefined custom resolvers', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const defaultResolver = createResolver<ResponseOptions>({
      name: 'default',
      operation: () => ({
        file: createFile('default.ts', 'default.ts'),
        outputs: { default: { name: 'Default' }, response: { name: 'Default' } },
      }),
    })

    const merged = mergeResolvers(undefined, [defaultResolver])

    expect(merged).toHaveLength(1)
    expect(merged[0]?.name).toBe('default')
  })
})

describe('executeResolvers', () => {
  it('should execute first resolver with operation handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver1 = createResolver<ResponseOptions>({
      name: 'no-handler',
      schema: () => ({
        file: createFile('schema.ts', 'schema.ts'),
        outputs: { default: { name: 'Schema' }, type: { name: 'Schema' } },
      }),
    })

    const resolver2 = createResolver<ResponseOptions>({
      name: 'with-handler',
      operation: () => ({
        file: createFile('operation.ts', 'operation.ts'),
        outputs: { default: { name: 'Operation' }, response: { name: 'Operation' } },
      }),
    })

    const result = executeResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Operation')
  })

  it('should execute first resolver if no match function defined', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver = createResolver<ResponseOptions>({
      name: 'always-match',
      operation: () => ({
        file: createFile('always.ts', 'always.ts'),
        outputs: { default: { name: 'Always' }, response: { name: 'Always' } },
      }),
    })

    const result = executeResolvers([resolver], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Always')
  })

  it('should return null if no resolver has operation handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver = createResolver<ResponseOptions>({
      name: 'schema-only',
      schema: () => ({
        file: createFile('test.ts', 'test.ts'),
        outputs: { default: { name: 'Test' }, type: { name: 'Test' } },
      }),
    })

    const result = executeResolvers([resolver], ctx)

    expect(result).toBeNull()
  })

  it('should return null for empty resolvers array', () => {
    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const result = executeResolvers([], ctx)

    expect(result).toBeNull()
  })

  it('should skip resolvers without operation handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver1 = createResolver<ResponseOptions>({
      name: 'schema-only',
      schema: () => ({
        file: createFile('schema.ts', 'schema.ts'),
        outputs: { default: { name: 'Schema' }, type: { name: 'Schema' } },
      }),
    })

    const resolver2 = createResolver<ResponseOptions>({
      name: 'operation-handler',
      operation: () => ({
        file: createFile('operation.ts', 'operation.ts'),
        outputs: { default: { name: 'Operation' }, response: { name: 'Operation' } },
      }),
    })

    const result = executeResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Operation')
  })

  it('should provide correct context to resolver', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const capturedContexts: OperationResolverContext[] = []

    const resolver = createResolver<ResponseOptions>({
      name: 'capture-ctx',
      operation: (receivedCtx) => {
        capturedContexts.push(receivedCtx)
        return {
          file: createFile('test.ts', 'test.ts'),
          outputs: { default: { name: 'Test' }, response: { name: 'Test' } },
        }
      },
    })

    executeResolvers([resolver], ctx)

    expect(capturedContexts).toHaveLength(1)
    const capturedCtx = capturedContexts[0]!
    expect(capturedCtx.operation).toBe(mockOperation)
    expect(capturedCtx.operation.getOperationId()).toBe('getPetById')
    expect(capturedCtx.operation.getTags()).toEqual([{ name: 'pet' }])
    expect(capturedCtx.operation.path).toBe('/pets/{petId}')
    expect(capturedCtx.operation.method).toBe('get')
    expect(capturedCtx.config).toBe(mockConfig)
  })
})

describe('executeSchemaResolvers', () => {
  it('should execute schema resolvers', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: SchemaResolverContext = {
      schema: mockSchema,
      config: mockConfig,
    }

    const resolver = createResolver<ResponseOptions>({
      name: 'schema-resolver',
      schema: () => ({
        file: createFile('Pet.ts', 'types/Pet.ts'),
        outputs: { default: { name: 'Pet' }, type: { name: 'Pet' } },
      }),
    })

    const result = executeResolvers([resolver], ctx)

    expect(result).not.toBeNull()
    expect((result as any)?.outputs.type.name).toBe('Pet')
  })

  it('should skip resolvers without schema handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, { operation: 'response'; schema: 'type' }>

    const ctx: SchemaResolverContext = {
      schema: mockSchema,
      config: mockConfig,
    }

    const resolver1 = createResolver<ResponseOptions>({
      name: 'operation-only',
      operation: () => ({
        file: createFile('operation.ts', 'operation.ts'),
        outputs: { default: { name: 'Operation' }, response: { name: 'Operation' } },
      }),
    })

    const resolver2 = createResolver<ResponseOptions>({
      name: 'schema-handler',
      schema: () => ({
        file: createFile('schema.ts', 'schema.ts'),
        outputs: { default: { name: 'Schema' }, type: { name: 'Schema' } },
      }),
    })

    const result = executeResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect((result as any)?.outputs.type.name).toBe('Schema')
  })
})
