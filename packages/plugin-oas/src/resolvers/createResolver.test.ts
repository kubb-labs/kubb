import type { Config, PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { describe, expect, it } from 'vitest'
import { createResolver, executeOperationResolvers, executeSchemaResolvers, mergeResolvers } from './createResolver.ts'
import type { OperationResolverContext, SchemaResolverContext } from './types.ts'

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
type TestOptions = PluginFactoryOptions<'test-plugin', any, any, any, any, 'response' | 'request'>

describe('createResolver', () => {
  it('should create a resolver with operation handler', () => {
    const resolver = createResolver<TestOptions>({
      name: 'test-resolver',
      operation: () => ({
        file: { baseName: 'test.ts', path: 'types/test.ts' },
        outputs: {
          response: { name: 'TestResponse' },
          request: { name: 'TestRequest' },
        },
      }),
    })

    expect(resolver.name).toBe('test-resolver')
    expect(resolver.type).toBe('core')
    expect(typeof resolver.operation).toBe('function')
  })
})

describe('mergeResolvers', () => {
  it('should merge custom resolvers with defaults (custom first)', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const customResolver = createResolver<ResponseOptions>({
      name: 'custom',
      operation: () => ({
        file: { baseName: 'custom.ts', path: 'custom.ts' },
        outputs: { response: { name: 'Custom' } },
      }),
    })

    const defaultResolver = createResolver<ResponseOptions>({
      name: 'default',
      operation: () => ({
        file: { baseName: 'default.ts', path: 'default.ts' },
        outputs: { response: { name: 'Default' } },
      }),
    })

    const merged = mergeResolvers([customResolver], [defaultResolver])

    expect(merged).toHaveLength(2)
    expect(merged[0]?.name).toBe('custom')
    expect(merged[1]?.name).toBe('default')
  })

  it('should handle undefined custom resolvers', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const defaultResolver = createResolver<ResponseOptions>({
      name: 'default',
      operation: () => ({
        file: { baseName: 'default.ts', path: 'default.ts' },
        outputs: { response: { name: 'Default' } },
      }),
    })

    const merged = mergeResolvers(undefined, [defaultResolver])

    expect(merged).toHaveLength(1)
    expect(merged[0]?.name).toBe('default')
  })
})

describe('executeOperationResolvers', () => {
  it('should execute first resolver with operation handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver1 = createResolver<ResponseOptions>({
      name: 'no-handler',
      schema: () => ({
        file: { baseName: 'schema.ts', path: 'schema.ts' },
        outputs: { response: { name: 'Schema' } },
      }),
    })

    const resolver2 = createResolver<ResponseOptions>({
      name: 'with-handler',
      operation: () => ({
        file: { baseName: 'operation.ts', path: 'operation.ts' },
        outputs: { response: { name: 'Operation' } },
      }),
    })

    const result = executeOperationResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Operation')
  })

  it('should execute first resolver if no match function defined', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver = createResolver<ResponseOptions>({
      name: 'always-match',
      operation: () => ({
        file: { baseName: 'always.ts', path: 'always.ts' },
        outputs: { response: { name: 'Always' } },
      }),
    })

    const result = executeOperationResolvers([resolver], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Always')
  })

  it('should return null if no resolver has operation handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver = createResolver<ResponseOptions>({
      name: 'schema-only',
      schema: () => ({
        file: { baseName: 'test.ts', path: 'test.ts' },
        outputs: { response: { name: 'Test' } },
      }),
    })

    const result = executeOperationResolvers([resolver], ctx)

    expect(result).toBeNull()
  })

  it('should return null for empty resolvers array', () => {
    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const result = executeOperationResolvers([], ctx)

    expect(result).toBeNull()
  })

  it('should skip resolvers without operation handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const ctx: OperationResolverContext = {
      operation: mockOperation,
      config: mockConfig,
    }

    const resolver1 = createResolver<ResponseOptions>({
      name: 'schema-only',
      schema: () => ({
        file: { baseName: 'schema.ts', path: 'schema.ts' },
        outputs: { response: { name: 'Schema' } },
      }),
    })

    const resolver2 = createResolver<ResponseOptions>({
      name: 'operation-handler',
      operation: () => ({
        file: { baseName: 'operation.ts', path: 'operation.ts' },
        outputs: { response: { name: 'Operation' } },
      }),
    })

    const result = executeOperationResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Operation')
  })

  it('should provide correct context to resolver', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

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
          file: { baseName: 'test.ts', path: 'test.ts' },
          outputs: { response: { name: 'Test' } },
        }
      },
    })

    executeOperationResolvers([resolver], ctx)

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
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const ctx: SchemaResolverContext = {
      schema: mockSchema,
      config: mockConfig,
    }

    const resolver = createResolver<ResponseOptions>({
      name: 'schema-resolver',
      schema: () => ({
        file: { baseName: 'Pet.ts', path: 'types/Pet.ts' },
        outputs: { response: { name: 'Pet' } },
      }),
    })

    const result = executeSchemaResolvers([resolver], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Pet')
  })

  it('should skip resolvers without schema handler', () => {
    type ResponseOptions = PluginFactoryOptions<'test', any, any, any, any, 'response'>

    const ctx: SchemaResolverContext = {
      schema: mockSchema,
      config: mockConfig,
    }

    const resolver1 = createResolver<ResponseOptions>({
      name: 'operation-only',
      operation: () => ({
        file: { baseName: 'operation.ts', path: 'operation.ts' },
        outputs: { response: { name: 'Operation' } },
      }),
    })

    const resolver2 = createResolver<ResponseOptions>({
      name: 'schema-handler',
      schema: () => ({
        file: { baseName: 'schema.ts', path: 'schema.ts' },
        outputs: { response: { name: 'Schema' } },
      }),
    })

    const result = executeSchemaResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Schema')
  })
})
