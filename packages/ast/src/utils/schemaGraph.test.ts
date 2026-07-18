import { describe, expect, it } from 'vitest'
import { createContent } from '../nodes/content.ts'
import { createOperation } from '../nodes/operation.ts'
import { createParameter } from '../nodes/parameter.ts'
import { createProperty } from '../nodes/property.ts'
import { createResponse } from '../nodes/response.ts'
import { createSchema } from '../nodes/schema.ts'
import { collectImportedRefNames, collectReferencedSchemaNames, collectUsedSchemaNames, findCircularSchemas } from './schemaGraph.ts'

describe('findCircularSchemas', () => {
  it('returns empty set for acyclic schemas', () => {
    const Category = createSchema({ type: 'object', name: 'Category', properties: [] })
    const Pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
      ],
    })

    expect(findCircularSchemas([Category, Pet])).toStrictEqual(new Set())
  })

  it('detects direct self-reference (TreeNode → TreeNode)', () => {
    const TreeNode = createSchema({
      type: 'object',
      name: 'TreeNode',
      properties: [
        createProperty({ name: 'left', required: false, schema: createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }) }),
      ],
    })

    expect(findCircularSchemas([TreeNode])).toStrictEqual(new Set(['TreeNode']))
  })

  it('detects indirect cycle (Pet → Cat → Pet)', () => {
    const Pet = createSchema({
      type: 'union',
      name: 'Pet',
      members: [createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })],
    })
    const Cat = createSchema({
      type: 'object',
      name: 'Cat',
      properties: [
        createProperty({
          name: 'friends',
          required: false,
          schema: createSchema({ type: 'array', items: [createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })] }),
        }),
      ],
    })

    expect(findCircularSchemas([Pet, Cat])).toStrictEqual(new Set(['Pet', 'Cat']))
  })

  it('detects refs nested inside unions and arrays', () => {
    const A = createSchema({
      type: 'object',
      name: 'A',
      properties: [
        createProperty({
          name: 'next',
          required: false,
          schema: createSchema({
            type: 'union',
            members: [createSchema({ type: 'null' }), createSchema({ type: 'ref', name: 'A', ref: '#/components/schemas/A' })],
          }),
        }),
      ],
    })

    expect(findCircularSchemas([A])).toStrictEqual(new Set(['A']))
  })

  it('does not flag schemas that only reference cyclic schemas without participating', () => {
    // B → A → A, but A does not reference B.
    const A = createSchema({
      type: 'object',
      name: 'A',
      properties: [createProperty({ name: 'self', required: false, schema: createSchema({ type: 'ref', name: 'A', ref: '#/components/schemas/A' }) })],
    })
    const B = createSchema({
      type: 'object',
      name: 'B',
      properties: [createProperty({ name: 'a', required: false, schema: createSchema({ type: 'ref', name: 'A', ref: '#/components/schemas/A' }) })],
    })
    const result = findCircularSchemas([A, B])

    expect(result.has('A')).toBe(true)
    expect(result.has('B')).toBe(false)
  })

  it('skips unnamed schemas', () => {
    const anon = createSchema({ type: 'object' })
    expect(findCircularSchemas([anon])).toStrictEqual(new Set())
  })
})

describe('collectReferencedSchemaNames', () => {
  it('collects ref names nested in objects, arrays and unions', () => {
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
        createProperty({
          name: 'owner',
          required: false,
          schema: createSchema({
            type: 'union',
            members: [createSchema({ type: 'null' }), createSchema({ type: 'ref', name: 'User', ref: '#/components/schemas/User' })],
          }),
        }),
      ],
    })

    expect(collectReferencedSchemaNames(schema)).toStrictEqual(new Set(['Category', 'Tag', 'User']))
  })

  it('returns an empty set for schemas without refs', () => {
    expect(collectReferencedSchemaNames(createSchema({ type: 'string' }))).toStrictEqual(new Set())
  })
})

describe('collectImportedRefNames', () => {
  it('collects pointer-carrying ref names in first-occurrence order, de-duplicated', () => {
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
      ],
    })

    expect(collectImportedRefNames(schema)).toStrictEqual(['Category', 'Tag'])
  })

  it('prefers targetName for collision-renamed refs', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        createProperty({
          name: 'order',
          required: false,
          schema: createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' }),
        }),
      ],
    })

    expect(collectImportedRefNames(schema)).toStrictEqual(['OrderSchema'])
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

  it('memoizes by node identity so the same node yields the same array reference', () => {
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

  it('collects schema names referenced by parameters and responses, and excludes unreachable schemas', () => {
    const result = collectUsedSchemaNames([getItemsOp], schemas)

    expect(result).toStrictEqual(new Set(['ItemStatus', 'ItemsResponse']))
    expect(result.has('OrderStatus')).toBe(false)
    expect(result.has('OrdersResponse')).toBe(false)
  })

  it('collects schema names from multiple operations', () => {
    const result = collectUsedSchemaNames([getItemsOp, getOrdersOp], schemas)

    expect(result).toStrictEqual(new Set(['ItemStatus', 'ItemsResponse', 'OrderStatus', 'OrdersResponse']))
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
