import type { Operation, SchemaObject } from '@kubb/oas'
import { describe, expect, it } from 'vitest'
import { createResolver, executeResolvers, mergeResolvers } from './createResolver.ts'
import type { ResolverContext } from './types.ts'

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

describe('createResolver', () => {
  it('should create a resolver with the given configuration', () => {
    const resolver = createResolver<'response' | 'request'>({
      name: 'test-resolver',
      resolve: () => ({
        file: { baseName: 'test.ts', path: 'types/test.ts' },
        outputs: {
          response: { name: 'TestResponse' },
          request: { name: 'TestRequest' },
        },
      }),
    })

    expect(resolver.name).toBe('test-resolver')
    expect(typeof resolver.resolve).toBe('function')
  })

  it('should support optional match function', () => {
    const resolver = createResolver<'response'>({
      name: 'matched-resolver',
      match: (ctx) => ctx.operation?.getOperationId() === 'getPetById',
      resolve: () => ({
        file: { baseName: 'pet.ts', path: 'types/pet.ts' },
        outputs: {
          response: { name: 'PetResponse' },
        },
      }),
    })

    expect(resolver.match).toBeDefined()
    expect(resolver.match?.({ operation: mockOperation })).toBe(true)
    expect(
      resolver.match?.({
        operation: { ...mockOperation, getOperationId: () => 'other' } as unknown as Operation,
      }),
    ).toBe(false)
  })
})

describe('mergeResolvers', () => {
  it('should merge custom resolvers with defaults (custom first)', () => {
    const customResolver = createResolver<'response'>({
      name: 'custom',
      resolve: () => ({
        file: { baseName: 'custom.ts', path: 'custom.ts' },
        outputs: { response: { name: 'Custom' } },
      }),
    })

    const defaultResolver = createResolver<'response'>({
      name: 'default',
      resolve: () => ({
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
    const defaultResolver = createResolver<'response'>({
      name: 'default',
      resolve: () => ({
        file: { baseName: 'default.ts', path: 'default.ts' },
        outputs: { response: { name: 'Default' } },
      }),
    })

    const merged = mergeResolvers(undefined, [defaultResolver])

    expect(merged).toHaveLength(1)
    expect(merged[0]?.name).toBe('default')
  })
})

describe('executeResolvers', () => {
  it('should execute resolvers until one matches', () => {
    const ctx: ResolverContext = {
      operation: mockOperation,
    }

    const resolver1 = createResolver<'response'>({
      name: 'no-match',
      match: () => false,
      resolve: () => ({
        file: { baseName: 'no-match.ts', path: 'no-match.ts' },
        outputs: { response: { name: 'NoMatch' } },
      }),
    })

    const resolver2 = createResolver<'response'>({
      name: 'match',
      match: () => true,
      resolve: () => ({
        file: { baseName: 'match.ts', path: 'match.ts' },
        outputs: { response: { name: 'Match' } },
      }),
    })

    const result = executeResolvers([resolver1, resolver2], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Match')
  })

  it('should execute first resolver if no match function defined', () => {
    const ctx: ResolverContext = {
      operation: mockOperation,
    }

    const resolver = createResolver<'response'>({
      name: 'always-match',
      resolve: () => ({
        file: { baseName: 'always.ts', path: 'always.ts' },
        outputs: { response: { name: 'Always' } },
      }),
    })

    const result = executeResolvers([resolver], ctx)

    expect(result).not.toBeNull()
    expect(result?.outputs.response.name).toBe('Always')
  })

  it('should return null if no resolver matches', () => {
    const ctx: ResolverContext = {
      operation: mockOperation,
    }

    const resolver = createResolver<'response'>({
      name: 'no-match',
      match: () => false,
      resolve: () => ({
        file: { baseName: 'test.ts', path: 'test.ts' },
        outputs: { response: { name: 'Test' } },
      }),
    })

    const result = executeResolvers([resolver], ctx)

    expect(result).toBeNull()
  })

  it('should return null for empty resolvers array', () => {
    const ctx: ResolverContext = {}

    const result = executeResolvers([], ctx)

    expect(result).toBeNull()
  })

  it('should provide correct context to resolver', () => {
    const ctx: ResolverContext = {
      operation: mockOperation,
      schema: mockSchema,
    }

    const capturedContexts: ResolverContext[] = []

    const resolver = createResolver<'response'>({
      name: 'capture-ctx',
      resolve: (receivedCtx) => {
        capturedContexts.push(receivedCtx)
        return {
          file: { baseName: 'test.ts', path: 'test.ts' },
          outputs: { response: { name: 'Test' } },
        }
      },
    })

    executeResolvers([resolver], ctx)

    expect(capturedContexts).toHaveLength(1)
    const capturedCtx = capturedContexts[0]!
    expect(capturedCtx.operation).toBe(mockOperation)
    expect(capturedCtx.operation?.getOperationId()).toBe('getPetById')
    expect(capturedCtx.operation?.getTags()).toEqual([{ name: 'pet' }])
    expect(capturedCtx.operation?.path).toBe('/pets/{petId}')
    expect(capturedCtx.operation?.method).toBe('get')
    expect(capturedCtx.schema).toEqual(mockSchema)
  })
})
