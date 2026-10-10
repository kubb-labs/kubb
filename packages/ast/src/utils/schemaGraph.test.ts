import { describe, expect, it } from 'vitest'
import { createContent } from '../nodes/content.ts'
import { createOperation } from '../nodes/operation.ts'
import { createParameter } from '../nodes/parameter.ts'
import { createProperty } from '../nodes/property.ts'
import { createResponse } from '../nodes/response.ts'
import { createSchema } from '../nodes/schema.ts'
import { collectImportedRefNames, collectSchemaRefs, collectUsedSchemaNames, findCircularSchemas, findCircularSchemasFromGraph } from './schemaGraph.ts'

describe('findCircularSchemas', () => {
  it('detects an indirect cycle through refs nested in unions and arrays and skips acyclic schemas', () => {
    const Category = createSchema({ type: 'object', name: 'Category', properties: [] })
    const Pet = createSchema({
      type: 'union',
      name: 'Pet',
      members: [createSchema({ type: 'null' }), createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })],
    })
    const Cat = createSchema({
      type: 'object',
      name: 'Cat',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
        createProperty({
          name: 'friends',
          required: false,
          schema: createSchema({ type: 'array', items: [createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })] }),
        }),
      ],
    })

    expect(findCircularSchemas([Category, Pet, Cat])).toStrictEqual(new Set(['Pet', 'Cat']))
  })

  it('skips unnamed schemas', () => {
    const anon = createSchema({ type: 'object' })
    expect(findCircularSchemas([anon])).toStrictEqual(new Set())
  })
})

describe('findCircularSchemasFromGraph', () => {
  it('returns an empty set for an acyclic graph', () => {
    const graph = new Map([
      ['Pet', new Set(['Category'])],
      ['Category', new Set<string>()],
    ])

    expect(findCircularSchemasFromGraph(graph)).toStrictEqual(new Set())
  })

  it('detects a direct self-loop', () => {
    const graph = new Map([['TreeNode', new Set(['TreeNode'])]])

    expect(findCircularSchemasFromGraph(graph)).toStrictEqual(new Set(['TreeNode']))
  })

  it('detects an indirect cycle and leaves non-participants out', () => {
    const graph = new Map([
      ['Pet', new Set(['Cat'])],
      ['Cat', new Set(['Pet'])],
      ['Owner', new Set(['Pet'])],
    ])
    const result = findCircularSchemasFromGraph(graph)

    expect(result).toStrictEqual(new Set(['Pet', 'Cat']))
    expect(result.has('Owner')).toBe(false)
  })
})

describe('collectImportedRefNames', () => {
  it('collects pointer-carrying ref names in first-occurrence order, de-duplicated, preferring targetName', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
        createProperty({
          name: 'tags',
          required: false,
          schema: createSchema({ type: 'array', items: [createSchema({ type: 'ref', name: 'Tag', ref: '#/components/schemas/Tag' })] }),
        }),
        createProperty({ name: 'primary', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
        createProperty({
          name: 'order',
          required: false,
          schema: createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' }),
        }),
      ],
    })

    expect(collectImportedRefNames(schema)).toStrictEqual(['Category', 'Tag', 'OrderSchema'])
  })

  it('collects ref names from a tuple rest and from patternProperties', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Envelope',
      properties: [
        createProperty({
          name: 'pair',
          required: false,
          schema: createSchema({
            type: 'tuple',
            items: [createSchema({ type: 'string' })],
            rest: createSchema({ type: 'ref', name: 'Tail', ref: '#/components/schemas/Tail' }),
          }),
        }),
      ],
      patternProperties: { '^x-': createSchema({ type: 'ref', name: 'Extension', ref: '#/components/schemas/Extension' }) },
    })

    expect(collectImportedRefNames(schema)).toStrictEqual(['Tail', 'Extension'])
  })

  it('skips refs without a $ref pointer, such as union members pointing at a sibling', () => {
    const schema = createSchema({
      type: 'union',
      members: [createSchema({ type: 'ref', name: 'PetApplicationJson' }), createSchema({ type: 'ref', name: 'PetTextPlain' })],
    })

    expect(collectImportedRefNames(schema)).toStrictEqual([])
  })

  it('returns an empty array for schemas without refs', () => {
    expect(collectImportedRefNames(createSchema({ type: 'string' }))).toStrictEqual([])
  })

  it('returns the same array reference when called again with the same node', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
      ],
    })

    expect(collectImportedRefNames(schema)).toBe(collectImportedRefNames(schema))
  })
})

describe('collectSchemaRefs', () => {
  it('collects every resolvable ref name, including refs without a $ref pointer, and memoizes by node', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
        createProperty({
          name: 'variant',
          required: false,
          schema: createSchema({ type: 'union', members: [createSchema({ type: 'ref', name: 'PetApplicationJson' })] }),
        }),
      ],
    })

    expect(collectSchemaRefs(schema)).toStrictEqual(new Set(['Category', 'PetApplicationJson']))
    expect(collectSchemaRefs(schema)).toBe(collectSchemaRefs(schema))
  })

  it('returns an empty set for schemas without refs', () => {
    expect(collectSchemaRefs(createSchema({ type: 'string' }))).toStrictEqual(new Set())
  })
})

describe('collectUsedSchemaNames', () => {
  const itemStatusSchema = createSchema({ type: 'enum', name: 'ItemStatus', enumValues: ['ACTIVE', 'INACTIVE'] })
  const orderStatusSchema = createSchema({ type: 'enum', name: 'OrderStatus', enumValues: ['NEW', 'SHIPPED'] })
  const itemsResponseSchema = createSchema({
    type: 'object',
    name: 'ItemsResponse',
    properties: [createProperty({ name: 'items', required: false, schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }) })],
  })
  const ordersResponseSchema = createSchema({ type: 'object', name: 'OrdersResponse', properties: [] })

  const schemas = [itemStatusSchema, orderStatusSchema, itemsResponseSchema, ordersResponseSchema]

  const getItemsOp = createOperation({
    operationId: 'getItems',
    method: 'GET',
    path: '/items',
    tags: ['items'],
    parameters: [
      createParameter({
        name: 'status',
        in: 'query',
        required: false,
        schema: createSchema({ type: 'ref', name: 'ItemStatus', ref: '#/components/schemas/ItemStatus' }),
      }),
    ],
    responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'ItemsResponse', ref: '#/components/schemas/ItemsResponse' }) })],
  })

  const getOrdersOp = createOperation({
    operationId: 'getOrders',
    method: 'GET',
    path: '/orders',
    tags: ['orders'],
    parameters: [
      createParameter({
        name: 'status',
        in: 'query',
        required: false,
        schema: createSchema({ type: 'ref', name: 'OrderStatus', ref: '#/components/schemas/OrderStatus' }),
      }),
    ],
    responses: [
      createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'OrdersResponse', ref: '#/components/schemas/OrdersResponse' }) }),
    ],
  })

  it('collects the schema names reachable from the parameters and responses of the given operations only', () => {
    expect(collectUsedSchemaNames([getItemsOp], schemas)).toStrictEqual(new Set(['ItemStatus', 'ItemsResponse']))
    expect(collectUsedSchemaNames([getItemsOp, getOrdersOp], schemas)).toStrictEqual(new Set(['ItemStatus', 'ItemsResponse', 'OrderStatus', 'OrdersResponse']))
  })

  it('returns an empty set when the operations list is empty', () => {
    expect(collectUsedSchemaNames([], schemas)).toStrictEqual(new Set())
  })

  it('follows transitive schema references', () => {
    const tagSchema = createSchema({ type: 'enum', name: 'Tag', enumValues: ['tech', 'health'] })
    const itemSchema = createSchema({
      type: 'object',
      name: 'Item',
      properties: [createProperty({ name: 'tag', required: false, schema: createSchema({ type: 'ref', name: 'Tag', ref: '#/components/schemas/Tag' }) })],
    })
    const responseSchema = createSchema({
      type: 'object',
      name: 'ItemDetail',
      properties: [createProperty({ name: 'item', required: false, schema: createSchema({ type: 'ref', name: 'Item', ref: '#/components/schemas/Item' }) })],
    })
    const detailOp = createOperation({
      operationId: 'getItemDetail',
      method: 'GET',
      path: '/items/{id}',
      tags: ['items'],
      parameters: [],
      responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'ItemDetail', ref: '#/components/schemas/ItemDetail' }) })],
    })

    const result = collectUsedSchemaNames([detailOp], [tagSchema, itemSchema, responseSchema])

    expect(result).toStrictEqual(new Set(['ItemDetail', 'Item', 'Tag']))
  })

  it('collects schemas referenced in request body content', () => {
    const bodySchema = createSchema({ type: 'object', name: 'CreateItemBody', properties: [] })
    const createItemOp = createOperation({
      operationId: 'createItem',
      method: 'POST',
      path: '/items',
      tags: ['items'],
      parameters: [],
      requestBody: {
        required: true,
        content: [
          createContent({
            contentType: 'application/json',
            schema: createSchema({ type: 'ref', name: 'CreateItemBody', ref: '#/components/schemas/CreateItemBody' }),
          }),
        ],
      },
      responses: [],
    })

    const result = collectUsedSchemaNames([createItemOp], [bodySchema])

    expect(result).toStrictEqual(new Set(['CreateItemBody']))
  })
})
