import { ast } from '@kubb/core'
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

describe('adapterOas.stream', () => {
  it('yields each schema lazily via for await', async () => {
    const adapter = adapterOas({ validate: false })

    const node = await adapter.stream!({ type: 'data', data: minimalSpec })
    const schemas: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) {
      schemas.push(schema)
    }

    expect(schemas.map((s) => s.name)).toStrictEqual(['Pet', 'Category'])
  })

  it('each for await on schemas creates a fresh independent pass', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const first: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) first.push(schema)

    const second: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) second.push(schema)

    expect(first.map((s) => s.name)).toStrictEqual(['Pet', 'Category'])
    expect(second.map((s) => s.name)).toStrictEqual(first.map((s) => s.name))
  })

  it('yields operations lazily via for await', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const operations: Array<ast.OperationNode> = []
    for await (const op of node.operations) {
      operations.push(op)
    }

    expect(operations.map((operation) => operation.operationId)).toStrictEqual(['listPets'])
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

    const first = await adapter.stream!({ type: 'data', data: minimalSpec })
    const firstNames: Array<string> = []
    for await (const schema of first.schemas) if (schema.name) firstNames.push(schema.name)

    const second = await adapter.stream!({ type: 'data', data: other })
    const secondNames: Array<string> = []
    for await (const schema of second.schemas) if (schema.name) secondNames.push(schema.name)

    expect(firstNames).toStrictEqual(['Pet', 'Category'])
    expect(secondNames).toStrictEqual(['Order'])
    expect(second.meta?.title).toBe('Other API')
  })

  it('exposes meta before the first yield', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    expect(node.meta).toMatchObject({
      baseURL: null,
      circularNames: [],
      enumNames: [],
      title: 'Test API',
      version: '1.0.0',
    })
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
      ast.factory.createSchema({
        type: 'ref',
        ref: '#/components/schemas/Pet',
        name: 'Pet',
      }),
      () => ({
        name: 'PetType',
        path: './pet.ts',
      }),
    )

    expect(imports).toMatchObject([{ kind: 'Import', name: ['PetType'], path: './pet.ts' }])
  })

  it('resolves a $ref to a collision-renamed component name', async () => {
    const adapter = adapterOas()

    // schemas/Order and requestBodies/Order collide, so getSchemas renames the schema OrderSchema.
    await adapter.parse({
      type: 'data',
      data: {
        openapi: '3.0.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: { Order: { type: 'object', properties: { id: { type: 'string' } } } },
          requestBodies: {
            Order: { description: 'body', content: { 'application/json': { schema: { type: 'object' } } } },
          },
        },
      },
    })

    const imports = adapter.getImports(
      ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Order', name: 'Order' }),
      (schemaName) => ({ name: schemaName, path: `./${schemaName}.ts` }),
    )

    expect(imports).toMatchObject([{ kind: 'Import', name: ['OrderSchema'], path: './OrderSchema.ts' }])
  })
})
