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

describe('adapterOas options', () => {
  const discriminatedSpec = {
    openapi: '3.0.0',
    info: { title: 'Pets', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        Pet: {
          oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
          discriminator: { propertyName: 'petType', mapping: { cat: '#/components/schemas/Cat', dog: '#/components/schemas/Dog' } },
        },
        Cat: { type: 'object', required: ['petType'], properties: { petType: { type: 'string' }, name: { type: 'string' } } },
        Dog: { type: 'object', properties: { bark: { type: 'boolean' } } },
      },
    },
  } as const

  it('leaves child schemas as written for discriminator: preserve (default)', async () => {
    const node = await adapterOas({ validate: false }).parse({ type: 'data', data: discriminatedSpec })

    const cat = narrowSchema(
      node.schemas.find((schema) => schema.name === 'Cat')!,
      'object',
    )
    const dog = narrowSchema(
      node.schemas.find((schema) => schema.name === 'Dog')!,
      'object',
    )

    expect(cat?.properties.find((property) => property.name === 'petType')?.schema.type).toBe('string')
    expect(dog?.properties.map((property) => property.name)).toStrictEqual(['bark'])
  })

  it('pins the discriminator property to its mapping key on each child for discriminator: propagate', async () => {
    const node = await adapterOas({ validate: false, discriminator: 'propagate' }).parse({ type: 'data', data: discriminatedSpec })

    const cat = narrowSchema(
      node.schemas.find((schema) => schema.name === 'Cat')!,
      'object',
    )
    const dog = narrowSchema(
      node.schemas.find((schema) => schema.name === 'Dog')!,
      'object',
    )

    // An existing property is replaced in place, a missing one is appended.
    expect(cat?.properties.map((property) => property.name)).toStrictEqual(['petType', 'name'])
    expect(cat?.properties[0]).toMatchObject({ name: 'petType', required: true, schema: { type: 'enum', enumValues: ['cat'] } })
    expect(dog?.properties.map((property) => property.name)).toStrictEqual(['bark', 'petType'])
    expect(dog?.properties[1]).toMatchObject({ name: 'petType', required: true, schema: { type: 'enum', enumValues: ['dog'] } })
  })

  it('lifts inline enums to named root schemas and refs them for enums: root', async () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'sold'] } }],
            responses: { '200': { description: 'ok' } },
          },
        },
      },
      components: {
        schemas: {
          Pet: { type: 'object', properties: { status: { type: 'string', enum: ['available', 'sold'] } } },
        },
      },
    } as const

    const node = await adapterOas({ validate: false, enums: 'root' }).parse({ type: 'data', data: spec })

    expect(node.schemas.map((schema) => schema.name)).toStrictEqual(['PetStatusEnum', 'ListPetsStatus', 'Pet'])
    expect(node.schemas[0]).toMatchObject({ type: 'enum', name: 'PetStatusEnum', enumValues: ['available', 'sold'] })
    expect(node.meta?.enumNames).toStrictEqual(['PetStatusEnum', 'ListPetsStatus'])

    const pet = narrowSchema(
      node.schemas.find((schema) => schema.name === 'Pet')!,
      'object',
    )
    expect(pet?.properties[0]?.schema).toMatchObject({ type: 'ref', name: 'PetStatusEnum', ref: '#/components/schemas/PetStatusEnum' })

    const status = node.operations[0]?.parameters.find((parameter) => parameter.name === 'status')
    expect(status?.schema).toMatchObject({ type: 'ref', name: 'ListPetsStatus', ref: '#/components/schemas/ListPetsStatus' })
  })

  it('keeps inline enums on their property for enums: inline (default)', async () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: { type: 'object', properties: { status: { type: 'string', enum: ['available', 'sold'] } } },
        },
      },
    } as const

    const node = await adapterOas({ validate: false }).parse({ type: 'data', data: spec })

    expect(node.schemas.map((schema) => schema.name)).toStrictEqual(['Pet'])
    expect(node.meta?.enumNames).toStrictEqual([])
    const pet = narrowSchema(node.schemas[0]!, 'object')
    expect(pet?.properties[0]?.schema).toMatchObject({ type: 'enum', name: 'PetStatusEnum', enumValues: ['available', 'sold'] })
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
