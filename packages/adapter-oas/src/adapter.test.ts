import { narrowSchema, resolveRefName } from '@kubb/ast'
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

describe('adapterOas.parse', () => {
  it('parses each schema', async () => {
    const adapter = adapterOas({ validate: false })

    const node = await adapter.parse({ type: 'data', data: minimalSpec })

    expect(node.schemas.map((s) => s.name)).toStrictEqual(['Pet', 'Category'])
  })

  it('parses operations', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({ type: 'data', data: minimalSpec })

    expect(node.operations.map((operation) => operation.operationId)).toStrictEqual(['listPets'])
  })

  it('parses each source when one adapter instance is reused across configs', async () => {
    const other = {
      openapi: '3.0.0',
      info: { title: 'Other API', version: '2.0.0' },
      paths: {},
      components: { schemas: { Order: { type: 'object', properties: { id: { type: 'string' } } } } },
    } as const

    // A `defineConfig` array shares one adapter instance across configs. Each source must produce
    // its own document instead of replaying the first one.
    const adapter = adapterOas({ validate: false })

    const first = await adapter.parse({ type: 'data', data: minimalSpec })
    const second = await adapter.parse({ type: 'data', data: other })

    expect(first.schemas.map((s) => s.name)).toStrictEqual(['Pet', 'Category'])
    expect(second.schemas.map((s) => s.name)).toStrictEqual(['Order'])
    expect(second.meta?.title).toBe('Other API')
  })

  it('exposes meta', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({ type: 'data', data: minimalSpec })

    expect(node.meta).toMatchObject({
      baseURL: null,
      circularNames: [],
      enumNames: [],
      title: 'Test API',
      version: '1.0.0',
    })
  })
})

describe('adapterOas ref targetName', () => {
  it('leaves refs unstamped when no schema is renamed', async () => {
    const adapter = adapterOas()

    const node = await adapter.parse({
      type: 'data',
      data: {
        openapi: '3.0.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { type: 'object', properties: { id: { type: 'string' } } },
            PetList: { type: 'array', items: { $ref: '#/components/schemas/Pet' } },
          },
        },
      },
    })

    const petList = node.schemas.find((schema) => schema.name === 'PetList')
    const items = narrowSchema(petList!, 'array')?.items ?? []
    const ref = narrowSchema(items[0]!, 'ref')

    expect(ref?.ref).toBe('#/components/schemas/Pet')
    expect(ref?.targetName).toBeUndefined()
  })

  it('stamps schema and operation refs to a collision-renamed schema with the renamed name', async () => {
    const adapter = adapterOas()

    // `Order` exists in both `schemas` and `requestBodies`, so the schema is renamed to `OrderSchema`.
    // A `$ref` to it must resolve to `OrderSchema`, not the bare `Order` (whose file is never emitted).
    const node = await adapter.parse({
      type: 'data',
      data: {
        openapi: '3.0.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {
          '/orders/{orderId}': {
            get: {
              operationId: 'getOrder',
              responses: {
                '200': {
                  description: 'ok',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Order: { type: 'object', properties: { id: { type: 'string' } } },
            OrderList: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
          },
          requestBodies: {
            Order: { content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' } } } } } },
          },
        },
      },
    })

    expect(node.schemas.map((schema) => schema.name)).toContain('OrderSchema')

    const orderList = node.schemas.find((schema) => schema.name === 'OrderList')
    const items = narrowSchema(orderList!, 'array')?.items ?? []
    const schemaRef = narrowSchema(items[0]!, 'ref')

    expect(schemaRef?.targetName).toBe('OrderSchema')
    expect(resolveRefName(schemaRef)).toBe('OrderSchema')

    const responseRef = narrowSchema(node.operations[0]!.responses[0]!.content![0]!.schema!, 'ref')

    expect(responseRef?.targetName).toBe('OrderSchema')
    expect(resolveRefName(responseRef)).toBe('OrderSchema')
  })
})
