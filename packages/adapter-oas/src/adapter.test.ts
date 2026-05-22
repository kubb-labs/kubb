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
