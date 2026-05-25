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

    expect(schemas.length).toBe(2)
    expect(schemas.map((s) => s.name)).toEqual(expect.arrayContaining(['Pet', 'Category']))
  })

  it('each for await on schemas creates a fresh independent pass', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const first: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) first.push(schema)

    const second: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) second.push(schema)

    expect(second.length).toBe(first.length)
    expect(second.map((s) => s.name)).toEqual(first.map((s) => s.name))
  })

  it('yields operations lazily via for await', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const operations: Array<ast.OperationNode> = []
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

describe('adapterOas dedupe', () => {
  const dedupeSpec = {
    openapi: '3.0.0',
    info: { title: 'Dedupe API', version: '1.0.0' },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'inactive'] } } },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Pet: {
          type: 'object',
          properties: { status: { type: 'string', enum: ['active', 'inactive'] }, id: { type: 'string' } },
        },
        Order: {
          type: 'object',
          properties: { state: { type: 'string', enum: ['active', 'inactive'] }, total: { type: 'number' } },
        },
        Cat: { type: 'object', properties: { sound: { type: 'string' } } },
        Dog: { type: 'object', properties: { sound: { type: 'string' } } },
      },
    },
  } as const

  async function collectSchemas(node: ast.InputStreamNode): Promise<Array<ast.SchemaNode>> {
    const schemas: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) schemas.push(schema)
    return schemas
  }

  function propertySchema(schema: ast.SchemaNode | undefined, propName: string): ast.SchemaNode | undefined {
    return ast.narrowSchema(schema, 'object')?.properties.find((prop) => prop.name === propName)?.schema
  }

  it('leaves output unchanged when dedupe is off', async () => {
    const adapter = adapterOas({ validate: false })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: dedupeSpec }))

    expect(schemas.map((schema) => schema.name)).toEqual(['Pet', 'Order', 'Cat', 'Dog'])
    expect(
      propertySchema(
        schemas.find((schema) => schema.name === 'Pet'),
        'status',
      )?.type,
    ).toBe('enum')
    expect(schemas.find((schema) => schema.name === 'Dog')?.type).toBe('object')
  })

  it('hoists a duplicated enum into one shared schema and refs every occurrence', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const node = await adapter.stream!({ type: 'data', data: dedupeSpec })
    const schemas = await collectSchemas(node)

    const enums = schemas.filter((schema) => schema.type === 'enum')
    expect(enums).toHaveLength(1)
    const sharedEnum = ast.narrowSchema(enums[0], 'enum')!
    expect(sharedEnum.enumValues).toEqual(['active', 'inactive'])
    expect(node.meta?.enumNames).toContain(sharedEnum.name)

    const petStatus = ast.narrowSchema(
      propertySchema(
        schemas.find((schema) => schema.name === 'Pet'),
        'status',
      ),
      'ref',
    )
    expect(petStatus?.name).toBe(sharedEnum.name)
    const orderState = ast.narrowSchema(
      propertySchema(
        schemas.find((schema) => schema.name === 'Order'),
        'state',
      ),
      'ref',
    )
    expect(orderState?.name).toBe(sharedEnum.name)
  })

  it('aliases a structurally identical top-level schema to the canonical one', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: dedupeSpec }))

    const cat = schemas.find((schema) => schema.name === 'Cat')
    const dog = ast.narrowSchema(
      schemas.find((schema) => schema.name === 'Dog'),
      'ref',
    )

    expect(cat?.type).toBe('object')
    expect(dog?.type).toBe('ref')
    expect(dog?.ref).toBe('#/components/schemas/Cat')
  })

  it('rewrites duplicated inline shapes inside operations', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const node = await adapter.stream!({ type: 'data', data: dedupeSpec })

    const operations: Array<ast.OperationNode> = []
    for await (const operation of node.operations) operations.push(operation)

    const refNames = ast.collect<string>(operations[0]!, {
      schema(schema) {
        return ast.narrowSchema(schema, 'ref')?.name ?? null
      },
    })

    expect(refNames.length).toBeGreaterThan(0)
  })
})
