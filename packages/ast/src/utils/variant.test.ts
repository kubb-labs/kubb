import { describe, expect, it } from 'vitest'
import { narrowSchema } from '../guards.ts'
import { createProperty } from '../nodes/property.ts'
import type { SchemaNode } from '../nodes/schema.ts'
import { createSchema } from '../nodes/schema.ts'
import { buildSchemaVariant, computeVariantNames, variantName } from './variant.ts'

function object(name: string | null, properties: Array<{ name: string; schema: SchemaNode; required?: boolean }>): SchemaNode {
  return createSchema({
    type: 'object',
    name,
    properties: properties.map((p) => createProperty({ name: p.name, schema: p.schema, required: p.required ?? false })),
  })
}

const string = (extra: { readOnly?: boolean; writeOnly?: boolean } = {}) => createSchema({ type: 'string', ...extra })

const user = () =>
  object('User', [
    { name: 'id', schema: string({ readOnly: true }), required: true },
    { name: 'createdAt', schema: string({ readOnly: true }) },
    { name: 'username', schema: string(), required: true },
    { name: 'email', schema: string() },
    { name: 'password', schema: string({ writeOnly: true }) },
  ])

function propNames(node: SchemaNode): Array<string> {
  return narrowSchema(node, 'object')!.properties.map((p) => p.name)
}

describe('variantName', () => {
  it('builds *Request and *Response names', () => {
    expect(variantName('User', 'request')).toBe('UserRequest')
    expect(variantName('User', 'response')).toBe('UserResponse')
  })
})

describe('buildSchemaVariant', () => {
  it('drops readOnly properties for the request variant', () => {
    const variant = buildSchemaVariant({ node: user(), variant: 'request', variantNames: new Set() })
    expect(propNames(variant)).toStrictEqual(['username', 'email', 'password'])
  })

  it('drops writeOnly properties for the response variant', () => {
    const variant = buildSchemaVariant({ node: user(), variant: 'response', variantNames: new Set() })
    expect(propNames(variant)).toStrictEqual(['id', 'createdAt', 'username', 'email'])
  })

  it('filters nested objects recursively', () => {
    const product = object('Product', [
      { name: 'sku', schema: string() },
      {
        name: 'metadata',
        schema: object(null, [
          { name: 'createdBy', schema: string({ readOnly: true }) },
          { name: 'internalNotes', schema: string({ writeOnly: true }) },
        ]),
      },
    ])

    const request = buildSchemaVariant({ node: product, variant: 'request', variantNames: new Set() })
    const response = buildSchemaVariant({ node: product, variant: 'response', variantNames: new Set() })
    const metaOf = (n: SchemaNode) => narrowSchema(narrowSchema(n, 'object')!.properties.find((p) => p.name === 'metadata')!.schema, 'object')!

    expect(metaOf(request).properties.map((p) => p.name)).toStrictEqual(['internalNotes'])
    expect(metaOf(response).properties.map((p) => p.name)).toStrictEqual(['createdBy'])
  })

  it('filters readOnly inside arrays of objects', () => {
    const node = object('List', [
      {
        name: 'items',
        schema: createSchema({
          type: 'array',
          items: [
            object(null, [
              { name: 'id', schema: string({ readOnly: true }) },
              { name: 'name', schema: string() },
            ]),
          ],
        }),
      },
    ])
    const request = buildSchemaVariant({ node, variant: 'request', variantNames: new Set() })
    const itemObject = narrowSchema(narrowSchema(request, 'object')!.properties[0]!.schema, 'array')!.items![0]!
    expect(narrowSchema(itemObject, 'object')!.properties.map((p) => p.name)).toStrictEqual(['name'])
  })

  it('rewires a nested $ref to the target variant when the target has one', () => {
    const node = object('Order', [{ name: 'user', schema: createSchema({ type: 'ref', name: 'User', ref: '#/components/schemas/User' }) }])
    const request = buildSchemaVariant({ node, variant: 'request', variantNames: new Set(['User']) })
    const ref = narrowSchema(narrowSchema(request, 'object')!.properties[0]!.schema, 'ref')!
    expect(ref.name).toBe('UserRequest')
    expect(ref.ref).toBe('#/components/schemas/UserRequest')
  })

  it('leaves a nested $ref untouched when the target has no variant', () => {
    const node = object('Order', [{ name: 'tag', schema: createSchema({ type: 'ref', name: 'Tag', ref: '#/components/schemas/Tag' }) }])
    const request = buildSchemaVariant({ node, variant: 'request', variantNames: new Set(['User']) })
    const ref = narrowSchema(narrowSchema(request, 'object')!.properties[0]!.schema, 'ref')!
    expect(ref.name).toBe('Tag')
    expect(ref.ref).toBe('#/components/schemas/Tag')
  })
})

describe('computeVariantNames', () => {
  it('marks schemas by their own flags and propagates through refs', () => {
    const schemas = [
      { name: 'User', node: user() },
      { name: 'Tag', node: object('Tag', [{ name: 'label', schema: string() }]) },
      { name: 'Order', node: object('Order', [{ name: 'user', schema: createSchema({ type: 'ref', name: 'User', ref: '#/components/schemas/User' }) }]) },
    ]
    const { request, response } = computeVariantNames(schemas)

    expect([...request].sort()).toStrictEqual(['Order', 'User'])
    expect([...response].sort()).toStrictEqual(['Order', 'User'])
    expect(request.has('Tag')).toBe(false)
    expect(response.has('Tag')).toBe(false)
  })

  it('emits only the needed direction for single-flag schemas', () => {
    const schemas = [{ name: 'Token', node: object('Token', [{ name: 'secret', schema: string({ writeOnly: true }) }]) }]
    const { request, response } = computeVariantNames(schemas)
    expect(request.has('Token')).toBe(false)
    expect(response.has('Token')).toBe(true)
  })
})
