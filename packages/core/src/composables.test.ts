import { describe, expect, it } from 'vitest'
import { getCurrentNode, getOperation, getOperations, getOperationsByTag, getSchema, getSchemas, queryOutputs, resolveImport } from './composables.ts'
import { generatorContextStorage } from './generatorContext.ts'
import type { GeneratorContext } from './types.ts'

function makeMockContext(overrides: Partial<GeneratorContext> = {}): GeneratorContext {
  return {
    config: { root: '/project', output: { path: './gen' } } as GeneratorContext['config'],
    driver: {
      fileManager: { files: [] as any[] },
      outputRegistry: {
        query: () => [],
        resolve: () => undefined,
      },
    } as unknown as GeneratorContext['driver'],
    inputNode: {
      kind: 'Input',
      schemas: [{ kind: 'Schema', name: 'Pet', type: 'object' } as any, { kind: 'Schema', name: 'Error', type: 'object' } as any],
      operations: [
        { kind: 'Operation', operationId: 'listPets', method: 'get', path: '/pets', tags: ['pets'] } as any,
        { kind: 'Operation', operationId: 'createPet', method: 'post', path: '/pets', tags: ['pets'] } as any,
        { kind: 'Operation', operationId: 'getUser', method: 'get', path: '/users', tags: ['users'] } as any,
      ],
      meta: { title: 'Petstore', version: '1.0.0' },
    } as GeneratorContext['inputNode'],
    resolver: {} as GeneratorContext['resolver'],
    ...overrides,
  } as GeneratorContext
}

const mockSchemaNode = { kind: 'Schema' as const, name: 'Pet', type: 'object' as any }
const mockOperationNode = {
  kind: 'Operation' as const,
  operationId: 'listPets',
  method: 'get' as any,
  path: '/pets',
  tags: ['pets'],
  parameters: [],
  responses: [],
}

describe('kubb:spec composables — inside a generator context', () => {
  it('getSchemas() returns all schema nodes', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockSchemaNode }, async () => {
      expect(getSchemas()).toHaveLength(2)
      expect(getSchemas()[0]?.name).toBe('Pet')
    })
  })

  it('getSchema() finds by name', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockSchemaNode }, async () => {
      expect(getSchema('Pet')?.name).toBe('Pet')
      expect(getSchema('Missing')).toBeUndefined()
    })
  })

  it('getOperations() returns all operations', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockOperationNode }, async () => {
      expect(getOperations()).toHaveLength(3)
    })
  })

  it('getOperation() finds by operationId', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockOperationNode }, async () => {
      expect(getOperation('listPets')?.operationId).toBe('listPets')
      expect(getOperation('missing')).toBeUndefined()
    })
  })

  it('getOperationsByTag() filters by tag', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockOperationNode }, async () => {
      expect(getOperationsByTag('pets')).toHaveLength(2)
      expect(getOperationsByTag('users')).toHaveLength(1)
      expect(getOperationsByTag('nope')).toHaveLength(0)
    })
  })

  it('getCurrentNode() returns the node currently being processed', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockSchemaNode }, async () => {
      expect(getCurrentNode()).toBe(mockSchemaNode)
    })
  })

  it('getCurrentNode() returns null during the operations-batch call', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: null }, async () => {
      expect(getCurrentNode()).toBeNull()
    })
  })
})

describe('kubb:outputs composables — inside a generator context', () => {
  it('queryOutputs() delegates to the OutputRegistry', async () => {
    const mockEntries = [{ nodeId: 'Pet', nodeKind: 'schema', plugin: 'plugin-ts', kind: 'type', file: '/gen/types/pet.ts', exports: ['Pet'] }]
    const ctx = makeMockContext({
      driver: {
        fileManager: { files: [] as any[] },
        outputRegistry: {
          query: () => mockEntries,
          resolve: () => undefined,
        },
      } as unknown as GeneratorContext['driver'],
    })
    await generatorContextStorage.run({ ctx, currentNode: mockSchemaNode }, async () => {
      expect(queryOutputs({ nodeId: 'Pet' })).toEqual(mockEntries)
    })
  })

  it('resolveImport() returns null when no entry found', async () => {
    await generatorContextStorage.run({ ctx: makeMockContext(), currentNode: mockSchemaNode }, async () => {
      const imp = resolveImport({ schema: 'Pet', plugin: 'plugin-ts', kind: 'type', from: '/gen/client/pet.ts' })
      expect(imp).toBeNull()
    })
  })

  it('resolveImport() returns an ImportNode with a relative path when entry exists', async () => {
    const ctx = makeMockContext({
      driver: {
        fileManager: { files: [] as any[] },
        outputRegistry: {
          query: () => [],
          resolve: () => ({ nodeId: 'Pet', nodeKind: 'schema', plugin: 'plugin-ts', kind: 'type', file: '/gen/types/pet.ts', exports: ['Pet'] }),
        },
      } as unknown as GeneratorContext['driver'],
    })
    await generatorContextStorage.run({ ctx, currentNode: mockSchemaNode }, async () => {
      const imp = resolveImport({ schema: 'Pet', plugin: 'plugin-ts', kind: 'type', from: '/gen/client/pet.ts' })
      expect(imp).not.toBeNull()
      expect(imp?.path).toBe('../types/pet.ts')
      expect(imp?.isTypeOnly).toBe(true)
    })
  })
})

describe('composables — outside a generator context', () => {
  it('getSchemas() throws a helpful error', () => {
    expect(() => getSchemas()).toThrow(/called outside a generator context/)
  })

  it('getOperations() throws a helpful error', () => {
    expect(() => getOperations()).toThrow(/called outside a generator context/)
  })

  it('resolveImport() throws a helpful error', () => {
    expect(() => resolveImport({ schema: 'Pet', plugin: 'plugin-ts', from: '/gen/client.ts' })).toThrow(/called outside a generator context/)
  })
})
