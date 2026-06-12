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

    expect(schemas.map((s) => s.name)).toMatchInlineSnapshot(`
      [
        "Pet",
        "Category",
      ]
    `)
  })

  it('each for await on schemas creates a fresh independent pass', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const first: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) first.push(schema)

    const second: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) second.push(schema)

    expect(first.map((s) => s.name)).toMatchInlineSnapshot(`
      [
        "Pet",
        "Category",
      ]
    `)
    expect(second.map((s) => s.name)).toStrictEqual(first.map((s) => s.name))
  })

  it('yields operations lazily via for await', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.stream!({ type: 'data', data: minimalSpec })

    const operations: Array<ast.OperationNode> = []
    for await (const op of node.operations) {
      operations.push(op)
    }

    expect(operations.map((operation) => operation.operationId)).toMatchInlineSnapshot(`
      [
        "listPets",
      ]
    `)
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

    expect(node.meta).toMatchInlineSnapshot(`
      {
        "baseURL": null,
        "circularNames": [],
        "description": undefined,
        "enumNames": [],
        "title": "Test API",
        "version": "1.0.0",
      }
    `)
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

    expect(imports).toMatchInlineSnapshot(`
      [
        {
          "kind": "Import",
          "name": [
            "PetType",
          ],
          "path": "./pet.ts",
        },
      ]
    `)
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

  it('leaves output unchanged when dedupe is disabled', async () => {
    const adapter = adapterOas({ validate: false, dedupe: false })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: dedupeSpec }))

    expect(schemas.map((schema) => schema.name)).toMatchInlineSnapshot(`
      [
        "Pet",
        "Order",
        "Cat",
        "Dog",
      ]
    `)
    expect(
      propertySchema(
        schemas.find((schema) => schema.name === 'Pet'),
        'status',
      )?.type,
    ).toBe('enum')
    expect(schemas.find((schema) => schema.name === 'Dog')?.type).toBe('object')
  })

  it('dedupes by default when no option is passed', async () => {
    const adapter = adapterOas({ validate: false })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: dedupeSpec }))

    expect(schemas.map((schema) => schema.name)).toMatchInlineSnapshot(`
      [
        "PetStatusEnum",
        "Pet",
        "Order",
        "Cat",
        "Dog",
      ]
    `)
    expect(schemas.find((schema) => schema.name === 'Dog')?.type).toBe('ref')
  })

  it('hoists a duplicated enum into one shared schema and refs every occurrence', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const node = await adapter.stream!({ type: 'data', data: dedupeSpec })
    const schemas = await collectSchemas(node)

    const enums = schemas.filter((schema) => schema.type === 'enum')
    expect(enums).toHaveLength(1)
    const sharedEnum = ast.narrowSchema(enums[0], 'enum')!
    expect({ name: sharedEnum.name, primitive: sharedEnum.primitive, enumValues: sharedEnum.enumValues }).toMatchInlineSnapshot(`
      {
        "enumValues": [
          "active",
          "inactive",
        ],
        "name": "PetStatusEnum",
        "primitive": "string",
      }
    `)
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
    expect({ name: dog?.name, type: dog?.type, ref: dog?.ref }).toMatchInlineSnapshot(`
      {
        "name": "Dog",
        "ref": "#/components/schemas/Cat",
        "type": "ref",
      }
    `)
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

    expect(refNames).toMatchInlineSnapshot(`
      [
        "PetStatusEnum",
      ]
    `)
  })
})

describe('adapterOas collapsed bundling artifacts', () => {
  // Mirrors a bundled document where the ref bundler hoisted an external copy of `Category`
  // next to the local one as `Category1` and rewrote the ref sites to it.
  const bundledSpec = {
    openapi: '3.0.0',
    info: { title: 'Bundled API', version: '1.0.0' },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Category1' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Category: {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
        },
        Category1: {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
        },
        Category2: {
          type: 'object',
          properties: { label: { type: 'string' } },
        },
        Pet: {
          type: 'object',
          properties: { category: { $ref: '#/components/schemas/Category1' } },
        },
      },
    },
  } as const

  async function collectSchemas(node: ast.InputStreamNode): Promise<Array<ast.SchemaNode>> {
    const schemas: Array<ast.SchemaNode> = []
    for await (const schema of node.schemas) schemas.push(schema)
    return schemas
  }

  it('drops a suffixed schema that is identical to the schema it collided with', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: bundledSpec }))

    expect(schemas.map((schema) => schema.name)).toStrictEqual(['Category', 'Category2', 'Pet'])
    expect(schemas.find((schema) => schema.name === 'Category')?.type).toBe('object')
  })

  it('repoints schema refs from the collapsed name to the canonical one', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: bundledSpec }))

    const pet = ast.narrowSchema(
      schemas.find((schema) => schema.name === 'Pet'),
      'object',
    )
    const category = ast.narrowSchema(pet?.properties.find((prop) => prop.name === 'category')?.schema, 'ref')

    expect({ name: category?.name, ref: category?.ref }).toStrictEqual({
      name: 'Category',
      ref: '#/components/schemas/Category',
    })
  })

  it('repoints operation refs from the collapsed name to the canonical one', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const node = await adapter.stream!({ type: 'data', data: bundledSpec })

    const operations: Array<ast.OperationNode> = []
    for await (const operation of node.operations) operations.push(operation)

    const refNames = ast.collect<string>(operations[0]!, {
      schema(schema) {
        return ast.narrowSchema(schema, 'ref')?.name ?? null
      },
    })

    expect(refNames).toStrictEqual(['Category'])
  })

  it('keeps a suffixed schema whose shape differs from the base name', async () => {
    const adapter = adapterOas({ validate: false, dedupe: true })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: bundledSpec }))

    expect(schemas.find((schema) => schema.name === 'Category2')?.type).toBe('object')
  })

  it('keeps the suffixed schema when dedupe is disabled', async () => {
    const adapter = adapterOas({ validate: false, dedupe: false })
    const schemas = await collectSchemas(await adapter.stream!({ type: 'data', data: bundledSpec }))

    expect(schemas.map((schema) => schema.name)).toStrictEqual(['Category', 'Category1', 'Category2', 'Pet'])
  })
})
