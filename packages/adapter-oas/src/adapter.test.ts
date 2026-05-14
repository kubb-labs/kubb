import { ast } from '@kubb/core'
import type { AdapterCache } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const minimalSpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        responses: { '200': { description: 'ok' } },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: { id: { type: 'string' }, name: { type: 'string' } },
        required: ['id'],
      },
      Category: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
    },
  },
} as const

describe('adapterOas.count', () => {
  it('returns schema and operation counts without parsing AST nodes', async () => {
    const adapter = adapterOas({ validate: false })
    const { schemas, operations } = await adapter.count!({ type: 'data', data: minimalSpec })
    expect(schemas).toBe(2)
    expect(operations).toBe(1)
  })
})

describe('adapterOas.stream', () => {
  it('yields each schema lazily via for await', async () => {
    const adapter = adapterOas({ validate: false })
    await adapter.count!({ type: 'data', data: minimalSpec })

    const node = await adapter.stream!({ type: 'data', data: minimalSpec })
    const schemas: ast.SchemaNode[] = []
    for await (const schema of node.schemas) {
      schemas.push(schema)
    }

    expect(schemas.length).toBe(2)
    expect(schemas.map((s) => s.name)).toEqual(expect.arrayContaining(['Pet', 'Category']))
  })

  it('each for await on schemas creates a fresh independent pass', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const first: ast.SchemaNode[] = []
    for await (const schema of node.schemas) first.push(schema)

    const second: ast.SchemaNode[] = []
    for await (const schema of node.schemas) second.push(schema)

    expect(second.length).toBe(first.length)
    expect(second.map((s) => s.name)).toEqual(first.map((s) => s.name))
  })

  it('yields operations lazily via for await', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const operations: ast.OperationNode[] = []
    for await (const op of node.operations) {
      operations.push(op)
    }

    expect(operations.length).toBe(1)
    expect(operations[0]?.operationId).toBe('listPets')
  })

  it('exposes meta before the first yield', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    expect(node.meta?.title).toBe('Test API')
    expect(node.meta?.version).toBe('1.0.0')
  })
})

describe('adapterOas disk cache (count + stream)', () => {
  function makeMemoryCache(): AdapterCache & { store: Map<string, string> } {
    const store = new Map<string, string>()
    return {
      dir: '/test/.kubb/.cache',
      store,
      storage: {
        name: 'memory',
        async hasItem(key) { return store.has(key) },
        async getItem(key) { return store.get(key) ?? null },
        async setItem(key, value) { store.set(key, value) },
        async removeItem(key) { store.delete(key) },
        async getKeys() { return [...store.keys()] },
        async clear() { store.clear() },
      },
    }
  }

  it('count() writes to cache on first call and skips parseFromConfig on second adapter instance', async () => {
    const cache = makeMemoryCache()
    const source = { type: 'data' as const, data: minimalSpec, cache }

    const adapter1 = adapterOas({ validate: false })
    await adapter1.count!(source)
    expect(cache.store.size).toBe(1)

    // A second adapter instance with the same cache should read from disk, not re-parse
    const adapter2 = adapterOas({ validate: false })
    const { schemas } = await adapter2.count!(source)
    expect(schemas).toBe(2)
  })

  it('stream() writes to cache and second adapter instance reads it', async () => {
    const cache = makeMemoryCache()
    const source = { type: 'data' as const, data: minimalSpec, cache }

    const adapter1 = adapterOas({ validate: false })
    const node = await adapter1.stream!(source)
    const schemas1: ast.SchemaNode[] = []
    for await (const schema of node.schemas) schemas1.push(schema)

    // Cache should have been written
    expect(cache.store.size).toBe(1)

    // Second adapter reads from cache — same schemas
    const adapter2 = adapterOas({ validate: false })
    const node2 = await adapter2.stream!(source)
    const schemas2: ast.SchemaNode[] = []
    for await (const schema of node2.schemas) schemas2.push(schema)

    expect(schemas2.map((s) => s.name)).toEqual(schemas1.map((s) => s.name))
  })
})

describe('adapterOas.getImports', () => {
  it('returns named imports as string arrays', async () => {
    const adapter = adapterOas()

    await adapter.parse({
      type: 'data',
      data: {
        openapi: '3.0.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        },
      },
    })

    const imports = adapter.getImports(
      ast.createSchema({
        type: 'ref',
        ref: '#/components/schemas/Pet',
        name: 'Pet',
      }),
      () => ({
        name: 'PetType',
        path: './pet.ts',
      }),
    )

    expect(imports).toHaveLength(1)
    expect(imports[0]).toMatchObject({ name: ['PetType'], path: './pet.ts' })
  })
})
